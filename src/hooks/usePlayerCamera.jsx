import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, folder } from "leva";
import usePlayer from "../stores/usePlayer.jsx";
import { GAME_CONFIG } from "../config/gameConfig.js";

const _targetPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export function usePlayerCamera() {
  const { offsetY, offsetZ, posSmooth, lookSmooth } = useControls("Camera Follow", {
    offsetY: { value: 60, min: 10, max: 120, step: 1 },
    offsetZ: { value: 30, min: 0, max: 60, step: 1 },
    posSmooth: { value: 5, min: 1, max: 20, step: 0.5 },
    lookSmooth: { value: 7, min: 1, max: 20, step: 0.5 },
  });

  const smoothedPosition = useRef(new THREE.Vector3(0, 60, 30));
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const { position, velocity, cameraShakeTimer, cameraShakeIntensity } = usePlayer.getState();

    // Target camera position: above player with offset
    _targetPos.set(
      position[0],
      offsetY,
      position[2] + offsetZ
    );

    // Look at player position with slight lead based on velocity
    _lookTarget.set(
      position[0] + velocity[0] * 0.1,
      0,
      position[2] + velocity[2] * 0.1
    );

    // Frame-rate independent smooth lerp
    const posLerp = 1 - Math.exp(-posSmooth * delta);
    const lookLerp = 1 - Math.exp(-lookSmooth * delta);
    smoothedPosition.current.lerp(_targetPos, posLerp);
    smoothedLookAt.current.lerp(_lookTarget, lookLerp);

    state.camera.position.copy(smoothedPosition.current);

    // Camera shake (Story 4.6) — applied to camera position directly,
    // NOT to smoothedPosition ref, to avoid corrupting the smooth follow state
    if (cameraShakeTimer > 0) {
      const t = cameraShakeTimer / GAME_CONFIG.CAMERA_SHAKE_DURATION;
      const amp = cameraShakeIntensity * t;
      const elapsed = state.clock.elapsedTime;
      state.camera.position.x += Math.sin(elapsed * 37.5) * amp;
      state.camera.position.z += Math.cos(elapsed * 53.1) * amp;
    }

    state.camera.lookAt(smoothedLookAt.current);
  });
}
