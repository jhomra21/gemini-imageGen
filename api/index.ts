import { Hono } from 'hono'
import { cors } from 'hono/cors'
// Use the correct import path and necessary types from @google/genai
import { GoogleGenAI, Modality } from '@google/genai';
import type { Part } from '@google/genai';

// Define a type for the binding that Hono will expect for environment variables
// This helps with TypeScript checking for c.env
type Bindings = {
  GEMINI_API_KEY: string;
  // Add other environment bindings if you have them
}

const app = new Hono<{ Bindings: Bindings }>() // Apply Bindings type to Hono

// Apply CORS middleware
app.use('*', cors({
  origin: '*', // Allow all origins
  allowHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'], // Specify allowed methods
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

app.get('/', (c) => c.text('Hello Hono on Cloudflare Workers for Gemini Proxy!'))

// New route for image editing
app.post('/api/edit-image-with-prompt', async (c) => {
  try {
    const { imageDataB64, mimeType, prompt } = await c.req.json<{ imageDataB64: string; mimeType: string; prompt: string }>()

    if (!imageDataB64 || !mimeType || !prompt) {
      return c.json({ error: 'Missing imageDataB64, mimeType, or prompt' }, 400)
    }
    
    if (!c.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured in Cloudflare Worker environment.');
      return c.json({ error: 'API key not configured on server.' }, 500);
    }

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
    
    const modelName = "gemini-2.0-flash-preview-image-generation"; 

    const imagePart: Part = {
      inlineData: {
        data: imageDataB64, 
        mimeType: mimeType, 
      },
    };
    
    const textPart: Part = {
      text: prompt,
    };

    const contents = [imagePart, textPart];

    const result = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      }
    });
    
    const candidates = result.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      // Find the image part
      const imagePart = candidates[0].content.parts.find(
        (p: Part) => p.inlineData && p.inlineData.data && p.inlineData.mimeType?.startsWith("image/")
      );
      // Find the text part (if any)
      const textPartFound = candidates[0].content.parts.find((p: Part) => p.text); // Added type Part here

      if (imagePart?.inlineData) { // Check if imagePart and its inlineData exist
        return c.json({
          editedImageDataB64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType,
          textResponse: textPartFound?.text // Include text if found
        });
      }
    }
    
    // Fallback if no direct image part found, but there might be text.
    const responseText = result.text; 
    if (responseText) {
        console.log("Gemini API returned only text:", responseText);
        return c.json({ message: "Received a text response, potentially an error or explanation from the model.", textResponse: responseText }, 202);
    }

    return c.json({ error: 'No suitable image or text data found in Gemini response' }, 500);

  } catch (error: any) {
    console.error('Error processing image editing request:', error.message, error.stack);
    return c.json({ error: error.message || 'Failed to process image editing request' }, 500)
  }
})

export default app