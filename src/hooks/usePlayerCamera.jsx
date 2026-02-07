import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import usePlayer from "../stores/usePlayer.jsx";

const _cameraOffset = new THREE.Vector3(0, 60, 30);
const _targetPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export function usePlayerCamera() {
  const smoothedPosition = useRef(new THREE.Vector3(0, 60, 30));
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const { position, velocity } = usePlayer.getState();

    // Target camera position: above player with offset
    _targetPos.set(
      position[0] + _cameraOffset.x,
      _cameraOffset.y,
      position[2] + _cameraOffset.z
    );

    // Look at player position with slight lead based on velocity
    _lookTarget.set(
      position[0] + velocity[0] * 0.1,
      0,
      position[2] + velocity[2] * 0.1
    );

    // Smooth lerp for camera position and target
    smoothedPosition.current.lerp(_targetPos, 0.08);
    smoothedLookAt.current.lerp(_lookTarget, 0.1);

    state.camera.position.copy(smoothedPosition.current);
    state.camera.lookAt(smoothedLookAt.current);
  });
}
