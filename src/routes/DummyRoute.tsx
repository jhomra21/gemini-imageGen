import { Show, createSignal, onMount, createEffect } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { Transition } from "solid-transition-group";
import { ImagePromptEditor } from "./ImagePromptEditor";

// The actual fetching logic - explicitly type the return as Promise<string>
const fetchApiData = async (): Promise<string> => {
  // Connect to the API endpoint
  const response = await fetch("http://127.0.0.1:8787/"); // Assuming GET request to the root
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
  }
  const data = await response.text();
  try {
    // Try to parse as JSON for pretty printing if it is JSON
    const jsonData = JSON.parse(data);
    return JSON.stringify(jsonData, null, 2);
  } catch (e) {
    // If not JSON, just return the raw text
    return data;
  }
};

export function DummyRoute() {
  const query = useQuery(() => ({
    queryKey: ["dummyApiData"],
    queryFn: fetchApiData,
    enabled: false,
  }));

  const [animationClass, setAnimationClass] = createSignal("route-enter-initial");
  const [shouldShowResponse, setShouldShowResponse] = createSignal(false);

  onMount(() => {
    setTimeout(() => {
      setAnimationClass("route-enter-active");
    }, 10);
  });

  createEffect(() => {
    if (query.isSuccess && query.data) {
      setShouldShowResponse(true);
    } else {
      setShouldShowResponse(false);
    }
  });
  
  return (
    <div class={`p-4 space-y-4 rounded-lg shadow-md bg-white ${animationClass()}`}>
      <h3 class="text-2xl font-semibold text-gray-800">Hello from the Dummy Route!</h3>
      <p class="text-gray-600">This component features a button to connect to a local API using TanStack Solid Query.</p>
      <button
        onClick={() => query.refetch()}
        disabled={query.isFetching}    
        class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <Show when={query.isFetching} fallback={"Fetch Data from API"}>
          Loading...
        </Show>
      </button>

      <Transition 
        onEnter={(el, done) => {
          
          // Cast element to HTMLElement to fix TypeScript errors
          const htmlEl = el as HTMLElement;
          
          // Initial state - hidden
          htmlEl.style.opacity = "0";
          htmlEl.style.filter = "blur(4px)";
          
          // Allow DOM to update with initial styles
          requestAnimationFrame(() => {
            // Start the animation
            const animation = htmlEl.animate([
              { opacity: 0, filter: 'blur(10px)', transform: 'translateY(-5px)' },  // Start slightly above
              { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' }      // End at normal position
            ], {
              duration: 150,
              easing: 'ease-in-out',
              fill: 'forwards'
            });
            
            // Call done when animation completes
            animation.onfinish = () => {
              htmlEl.style.opacity = "1";     // Ensure the final state is applied
              htmlEl.style.filter = "blur(0)"; // Ensure the final state is applied
              done();
            };
          });
        }}
        onExit={(el, done) => {
          
          // Cast element to HTMLElement to fix TypeScript errors
          const htmlEl = el as HTMLElement;
          
          // Start the animation
          const animation = htmlEl.animate([
            { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },    // Start at normal position
            { opacity: 0, filter: 'blur(10px)', transform: 'translateY(-5px)' } // End slightly above
          ], {
            duration: 150,
            easing: 'ease-in-out',
            fill: 'forwards'
          });
          
          // Call done when animation completes
          animation.onfinish = () => {
            done();
          };
        }}
      >
        <Show when={shouldShowResponse()}>
          <div class="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
            <h4 class="font-semibold text-lg text-gray-700 mb-2">API Response:</h4>
            <pre class="text-sm text-gray-800 bg-white p-3 rounded-md shadow overflow-x-auto">
              {query.data}
            </pre>
          </div>
        </Show>
      </Transition>

      <Show when={query.isError && !!query.error && !query.isFetching}>
        <div class="mt-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          <h4 class="font-semibold text-lg mb-2">Error:</h4>
          <p class="text-sm">{(query.error as Error)?.message || "An unknown error occurred"}</p>
        </div>
      </Show>
      <ImagePromptEditor />
    </div>
  );
} 