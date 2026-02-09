import "./style.css";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import Experience from "./Experience.jsx";
import Interface from "./ui/Interface.jsx";
import { KeyboardControls } from "@react-three/drei";

const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <KeyboardControls
    map={[
      { name: "moveForward", keys: ["ArrowUp", "KeyW"] },
      { name: "moveBackward", keys: ["ArrowDown", "KeyS"] },
      { name: "moveLeft", keys: ["ArrowLeft", "KeyA"] },
      { name: "moveRight", keys: ["ArrowRight", "KeyD"] },
      { name: "dash", keys: ["Space"] },
    ]}
  >
    <Canvas
      shadows
      camera={{
        fov: 45,
        near: 0.1,
        far: 10000,
      }}
    >
      <Experience />
    </Canvas>
    <Interface />
  </KeyboardControls>
);
