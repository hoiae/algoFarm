import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const ModelViewer = ({ modelData, scale = 1, animation = 'Walk', rotation = 0, pauseAnimation = false, onAnimationComplete }) => {
  const groupRef = useRef();
  const { scene, camera } = useThree();
  const [gltf, setGltf] = useState(null);
  const mixerRef = useRef();
  const currentAnimationRef = useRef(null);
  const [isDeathAnimationComplete, setIsDeathAnimationComplete] = useState(false);

  const animationMap = {
    Attack: 0, Bounce: 1, Clicked: 2, Death: 3, Eat: 4, Fear: 5, Fly: 6, Hit: 7,
    Idle_A: 8, Idle_B: 9, Idle_C: 10, Jump: 11, Roll: 12, Run: 13, Sit: 14,
    Spin: 15, Swim: 16, Walk: 17
  };

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.parse(
      modelData,
      '',
      (loadedGltf) => {
        console.log('GLTF loaded successfully:', loadedGltf);
        setGltf(loadedGltf);

        const mixer = new THREE.AnimationMixer(loadedGltf.scene);
        mixerRef.current = mixer;

        const defaultAnimationIndex = animationMap['Walk'];
        if (loadedGltf.animations[defaultAnimationIndex]) {
          const action = mixer.clipAction(loadedGltf.animations[defaultAnimationIndex]);
          action.play();
          currentAnimationRef.current = action;
        }
      },
      (error) => {
        console.error('An error occurred while loading the model:', error);
      }
    );
  }, [modelData]);

  useEffect(() => {
    if (gltf && mixerRef.current) {
      const animationIndex = animationMap[animation];
      if (typeof animationIndex !== 'undefined' && gltf.animations[animationIndex]) {
        if (currentAnimationRef.current) {
          currentAnimationRef.current.fadeOut(0.5);
        }
        const newAction = mixerRef.current.clipAction(gltf.animations[animationIndex]);

        if (animation === 'Death') {
          newAction.setLoop(THREE.LoopOnce);
          newAction.clampWhenFinished = true;
          setIsDeathAnimationComplete(false);

          newAction.reset().fadeIn(0.5).play();

          newAction.onFinished = () => {
            setIsDeathAnimationComplete(true);
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          };
        } else {
          newAction.reset().fadeIn(0.5).play();
        }

        currentAnimationRef.current = newAction;

        if (pauseAnimation && animation === 'Jump') {
          newAction.paused = true;
          newAction.time = newAction.getClip().duration * 0.25;
        } else {
          newAction.paused = false;
        }
      } else {
        console.warn(`Animation "${animation}" not found.`);
      }
    }
  }, [gltf, animation, pauseAnimation, onAnimationComplete]);

  useEffect(() => {
    if (gltf && groupRef.current) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxSize = Math.max(size.x, size.y, size.z);
      const scaleFactor = (1 / maxSize) * scale;
      groupRef.current.scale.setScalar(scaleFactor);

      groupRef.current.position.copy(center).multiplyScalar(-scaleFactor);

      const cameraDistance = 2;
      camera.position.set(cameraDistance, cameraDistance, cameraDistance);
      camera.lookAt(0, 0, 0);

      camera.near = 0.1;
      camera.far = 1000;
      camera.updateProjectionMatrix();

      console.log('Model positioned and scaled:', groupRef.current.position, groupRef.current.scale);
    }
  }, [gltf, camera, scale]);

  useFrame((state, delta) => {
    if (mixerRef.current && !isDeathAnimationComplete) {
      mixerRef.current.update(delta);
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  if (!gltf) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};

export default ModelViewer;
