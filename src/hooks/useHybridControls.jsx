import { useKeyboardControls } from "@react-three/drei";
import { useControlsStore } from "../stores/useControlsStore.jsx";
import { useEffect } from "react";

export function useHybridControls() {
  // Keyboard controls states
  const keyboardForward = useKeyboardControls((state) => state.moveForward);
  const keyboardBackward = useKeyboardControls((state) => state.moveBackward);
  const keyboardLeft = useKeyboardControls((state) => state.moveLeft);
  const keyboardRight = useKeyboardControls((state) => state.moveRight);
  const keyboardDash = useKeyboardControls((state) => state.dash);

  const setControl = useControlsStore((s) => s.setControl);

  // Synchronize keyboard controls to the store
  useEffect(() => {
    setControl("moveForward", keyboardForward);
  }, [keyboardForward, setControl]);

  useEffect(() => {
    setControl("moveBackward", keyboardBackward);
  }, [keyboardBackward, setControl]);

  useEffect(() => {
    setControl("moveLeft", keyboardLeft);
  }, [keyboardLeft, setControl]);

  useEffect(() => {
    setControl("moveRight", keyboardRight);
  }, [keyboardRight, setControl]);

  useEffect(() => {
    setControl("dash", keyboardDash);
  }, [keyboardDash, setControl]);
}
