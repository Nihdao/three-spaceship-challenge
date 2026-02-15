import "./style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./Experience.jsx";
import Interface from "./ui/Interface.jsx";
import { KeyboardControls } from "@react-three/drei";
import useGame from "./stores/useGame.jsx";
import { useEffect } from "react";

// Story 21.2: Wrapper component to access game phase for cursor style
function App() {
  const phase = useGame((s) => s.phase)

  // Story 21.2: Hide OS cursor during gameplay/boss, show during UI phases
  const cursorStyle = (phase === 'gameplay' || phase === 'boss') ? 'none' : 'default'

  // Also apply cursor style globally to body element (for HTML overlays)
  useEffect(() => {
    document.body.style.cursor = cursorStyle
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [cursorStyle])

  return (
    <KeyboardControls
      map={[
        { name: "moveForward", keys: ["ArrowUp", "KeyW"] },
        { name: "moveBackward", keys: ["ArrowDown", "KeyS"] },
        { name: "moveLeft", keys: ["ArrowLeft", "KeyA"] },
        { name: "moveRight", keys: ["ArrowRight", "KeyD"] },
        { name: "dash", keys: ["Space", "ShiftLeft", "ShiftRight"] },
      ]}
    >
      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 10000,
        }}
        style={{ cursor: cursorStyle }}
      >
        <Experience />
      </Canvas>
      <Interface />
    </KeyboardControls>
  )
}

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(<App />);
