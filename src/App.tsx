import { onMount, createSignal } from 'solid-js';
import logo from './logo.svg'

function App() {
  const [animationClass, setAnimationClass] = createSignal("route-enter-initial");

  onMount(() => {
    setTimeout(() => {
      setAnimationClass("route-enter-active");
    }, 10);
  });

  return (
    <main class={`min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)] text-center ${animationClass()}`}>
      <img
        src={logo}
        class="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
        alt="logo"
      />
      <p>
        Edit <code>src/App.tsx</code> and save to reload.
      </p>
      <a
        class="text-[#61dafb] hover:underline"
        href="https://solidjs.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn Solid
      </a>
      <a
        class="text-[#61dafb] hover:underline"
        href="https://tanstack.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn TanStack
      </a>
    </main>
  )
}

export default App
