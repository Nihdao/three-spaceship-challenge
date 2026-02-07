import { useControls } from "leva";
import { useCameraStore } from "../stores/useCameraStore.jsx";
import { useDebugMode } from "../hooks/useDebugMode.jsx";

export function DebugControls() {
  const { cameraMode, setCameraMode } = useCameraStore();
  const isDebugMode = useDebugMode();

  // Camera mode toggle (useful for development)
  useControls("Camera", {
    viewMode: {
      value: cameraMode,
      options: {
        "🚀 Third Person": "third-person",
        "👁️ Free Camera": "orbit",
      },
      onChange: (value) => setCameraMode(value),
    },
  });

  return {};
}
