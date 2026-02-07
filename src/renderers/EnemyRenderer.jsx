import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import useEnemies from '../stores/useEnemies.jsx'
import usePlayer from '../stores/usePlayer.jsx'

const MODEL_PATH = '/models/enemies/Robot%20Enemy%20Flying.glb'
const WALK_CLIP = 'CharacterArmature|Walk'

function EnemyInstance({ enemyId }) {
  const groupRef = useRef()
  const { scene, animations } = useGLTF(MODEL_PATH)
  const clone = useMemo(() => skeletonClone(scene), [scene])
  const mixerRef = useRef()

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clone)
    mixerRef.current = mixer
    const clip = animations.find((a) => a.name === WALK_CLIP) || animations[0]
    if (clip) mixer.clipAction(clip).play()
    return () => mixer.stopAllAction()
  }, [clone, animations])

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
    if (!groupRef.current) return

    const enemies = useEnemies.getState().enemies
    const playerPos = usePlayer.getState().position

    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].id !== enemyId) continue
      const e = enemies[i]

      groupRef.current.position.set(e.x, 0, e.z)

      const dx = playerPos[0] - e.x
      const dz = playerPos[2] - e.z
      groupRef.current.rotation.set(0, Math.atan2(dx, dz), 0)

      groupRef.current.scale.set(e.meshScale[0], e.meshScale[1], e.meshScale[2])
      break
    }
  })

  return <primitive ref={groupRef} object={clone} />
}

export default function EnemyRenderer() {
  const enemies = useEnemies((s) => s.enemies)

  return (
    <>
      {enemies.map((e) => (
        <EnemyInstance key={e.id} enemyId={e.id} />
      ))}
    </>
  )
}

useGLTF.preload(MODEL_PATH)
