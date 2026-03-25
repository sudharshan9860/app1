import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const ANIMATIONS = [
  't-pose',
  'explain',
  'victory',
  'sad',
  'hiphop',
  'salsa',
  'look-right',
  'defeated',
  'roll',
  'sad2',
  'jump'
];

function MascotModel({ currentAnimation, onAnimationsLoaded }) {
  const { scene, animations } = useGLTF('/models/new-mascot.glb');
  // IMPORTANT: Pass scene (not a group ref) to useAnimations so it binds to the skeleton
  const { actions, names, mixer } = useAnimations(animations, scene);
  const currentActionRef = useRef(null);

  useEffect(() => {
    if (names.length > 0) {
      onAnimationsLoaded(names);
      console.log('Available animations:', names);
    }
  }, [names, onAnimationsLoaded]);

  useEffect(() => {
    if (!actions || !currentAnimation) return;

    // Find the action
    const action = actions[currentAnimation];

    if (!action) {
      console.warn(`Animation "${currentAnimation}" not found`);
      return;
    }

    // Stop previous animation
    if (currentActionRef.current && currentActionRef.current !== action) {
      currentActionRef.current.fadeOut(0.3);
    }

    // Play new animation
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.fadeIn(0.3);
    action.play();

    currentActionRef.current = action;

    console.log(`Playing animation: ${currentAnimation}`);
  }, [currentAnimation, actions]);

  // Update the mixer every frame - CRITICAL for animation playback
  useFrame((state, delta) => {
    mixer?.update(delta);
  });

  return (
    <primitive object={scene} scale={1.5} position={[0, -1.5, 0]} />
  );
}

function MascotTest() {
  const [currentAnimation, setCurrentAnimation] = useState('');
  const [availableAnimations, setAvailableAnimations] = useState([]);
  const [error, setError] = useState(null);

  const handleAnimationsLoaded = (names) => {
    setAvailableAnimations(names);
    if (names.length > 0 && !currentAnimation) {
      // Start with t-pose or first available
      const defaultAnim = names.includes('t-pose') ? 't-pose' : names[0];
      setCurrentAnimation(defaultAnim);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        color: 'white',
        overflowX: 'auto'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Mascot Animation Test</h2>

        <div style={{ marginBottom: '15px' }}>
          <strong>Expected Animations:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {ANIMATIONS.map(anim => (
              <span
                key={anim}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: availableAnimations.includes(anim) ? '#28a745' : '#dc3545',
                  fontSize: '12px'
                }}
              >
                {anim} {availableAnimations.includes(anim) ? '✓' : '✗'}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Available in Model ({availableAnimations.length}):</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {availableAnimations.map(anim => (
              <button
                key={anim}
                onClick={() => setCurrentAnimation(anim)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentAnimation === anim ? '#007bff' : '#6c757d',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: currentAnimation === anim ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {anim}
              </button>
            ))}
          </div>
        </div>

        <div>
          <strong>Current Animation:</strong> {currentAnimation || 'None'}
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', marginTop: '10px' }}>
            Error: {error}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <Canvas
          camera={{ position: [0, 1, 4], fov: 50 }}
          frameloop="always"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#1a1a2e', 1);
          }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <spotLight position={[0, 10, 0]} intensity={0.5} />

          <Suspense fallback={null}>
            <MascotModel
              currentAnimation={currentAnimation}
              onAnimationsLoaded={handleAnimationsLoaded}
            />
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />

          <gridHelper args={[10, 10, '#444', '#333']} />
        </Canvas>
      </div>

      <div style={{
        padding: '10px 20px',
        background: 'rgba(0,0,0,0.3)',
        color: '#aaa',
        fontSize: '12px'
      }}>
        <strong>Controls:</strong> Left-click drag to rotate | Right-click drag to pan | Scroll to zoom
      </div>
    </div>
  );
}

export default MascotTest;
