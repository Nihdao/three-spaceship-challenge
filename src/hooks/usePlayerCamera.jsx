import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";
import usePlayer from "../stores/usePlayer.jsx";
import useGame from "../stores/useGame.jsx";
import { GAME_CONFIG } from "../config/gameConfig.js";

const _targetPos = new THREE.Vector3();

/**
 * Pure computation for a single camera frame. Exported for testability (H1 fix).
 * Mutates smoothedPosition, camera.position, and camera.rotation in place.
 * Story 43.3: shakeTimerOverride avoids spreading playerState to suppress shake during pause.
 */
export function computeCameraFrame(camera, smoothedPosition, playerState, delta, offsetY, posSmooth, elapsedTime, shakeTimerOverride) {
  const { position, cameraShakeIntensity } = playerState;
  const cameraShakeTimer = shakeTimerOverride !== undefined ? shakeTimerOverride : playerState.cameraShakeTimer;

  // Target camera position: directly above player (pure top-down, Story 14.1)
  _targetPos.set(position[0], offsetY, position[2]);

  // Frame-rate independent smooth lerp
  const posLerp = 1 - Math.exp(-posSmooth * delta);
  smoothedPosition.lerp(_targetPos, posLerp);

  camera.position.copy(smoothedPosition);

  // Camera shake (Story 4.6) — applied to camera position directly,
  // NOT to smoothedPosition ref, to avoid corrupting the smooth follow state
  if (cameraShakeTimer > 0) {
    const t = cameraShakeTimer / GAME_CONFIG.CAMERA_SHAKE_DURATION;
    const amp = cameraShakeIntensity * t;
    camera.position.x += Math.sin(elapsedTime * 37.5) * amp;
    camera.position.z += Math.cos(elapsedTime * 53.1) * amp;
  }

  // Fixed top-down orientation (Story 14.1): no lookAt, set rotation directly
  // to prevent any camera rotation tied to player facing or velocity
  camera.rotation.set(-Math.PI / 2, 0, 0);
}

export function usePlayerCamera() {
  const { offsetY, posSmooth } = useControls("Camera Follow", {
    offsetY: { value: 120, min: 10, max: 200, step: 1 },
    posSmooth: { value: 20, min: 1, max: 40, step: 0.5 },
  }, { hidden: import.meta.env.PROD });

  // Note: initial Y matches default offsetY to avoid lerp jump on first frame (L1)
  const smoothedPosition = useRef(new THREE.Vector3(0, 120, 0));

  useFrame((state, delta) => {
    const { phase, isPaused } = useGame.getState();
    // During systemEntry, fix camera at center so ship slides into frame
    if (phase === 'systemEntry') {
      smoothedPosition.current.set(0, offsetY, 0);
      state.camera.position.copy(smoothedPosition.current);
      state.camera.rotation.set(-Math.PI / 2, 0, 0);
      return;
    }
    const playerState = usePlayer.getState();
    // Story 43.3: suppress shake while paused — pass 0 as shakeTimerOverride instead of spreading
    // playerState (which would copy ~30+ fields). Single scalar replaces the whole object copy.
    const shakeOverride = isPaused && playerState.cameraShakeTimer > 0 ? 0 : undefined;
    computeCameraFrame(state.camera, smoothedPosition.current, playerState, delta, offsetY, posSmooth, state.clock.elapsedTime, shakeOverride);
  });
}
