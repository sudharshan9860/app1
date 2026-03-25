/**
 * Mascot3D - High-performance 3D Mascot Component
 *
 * Features:
 * - Model caching via useGLTF
 * - Animation blending with smooth transitions
 * - Lazy loading with Suspense
 * - Memory-optimized with proper cleanup
 * - Single canvas instance to prevent WebGL context loss
 */

import React, { useRef, useEffect, useMemo, memo, Suspense, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import { useMascot } from '../contexts/MascotContext';
import * as THREE from 'three';
import { Eye, EyeOff } from 'lucide-react';

// Model path constant
const MODEL_PATH = '/models/new-mascot.glb';

// Preload the model (this caches it for instant access)
useGLTF.preload(MODEL_PATH);

/**
 * Optimized Mascot Model Component
 * Handles model loading, animation, and rendering
 */
const MascotModel = memo(({
  scale = 1.5,
  position = [0, -1.5, 0],
  onLoaded
}) => {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names, mixer } = useAnimations(animations, scene);
  const { currentAnimation, transitionDuration, loopAnimation, setIsLoaded } = useMascot();

  // Previous animation ref for smooth transitions
  const currentActionRef = useRef(null);

  // Report available animations on load
  useEffect(() => {
    if (names.length > 0) {
      console.log('[Mascot3D] Available animations:', names);
      setIsLoaded(true);
      onLoaded?.();
    }
  }, [names, setIsLoaded, onLoaded]);

  // Handle animation changes
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.warn('[Mascot3D] No actions available');
      return;
    }

    const targetAnimation = currentAnimation;

    // Find the action - try exact match first, then case-insensitive
    let targetAction = actions[targetAnimation];

    if (!targetAction) {
      const animationKey = Object.keys(actions).find(
        key => key.toLowerCase() === targetAnimation?.toLowerCase()
      );
      if (animationKey) {
        targetAction = actions[animationKey];
      }
    }

    if (!targetAction) {
      console.warn(`[Mascot3D] Animation "${targetAnimation}" not found. Available:`, Object.keys(actions));
      targetAction = actions['t-pose'] || Object.values(actions)[0];
      if (!targetAction) return;
    }

    // Stop previous animation if different
    if (currentActionRef.current && currentActionRef.current !== targetAction) {
      currentActionRef.current.fadeOut(transitionDuration);
    }

    // Configure and play target animation
    targetAction.reset();
    if (loopAnimation) {
      targetAction.setLoop(THREE.LoopRepeat, Infinity);
      targetAction.clampWhenFinished = false;
    } else {
      targetAction.setLoop(THREE.LoopOnce, 1);
      targetAction.clampWhenFinished = true;
    }
    targetAction.setEffectiveTimeScale(0.6);
    targetAction.setEffectiveWeight(1);
    targetAction.fadeIn(transitionDuration);
    targetAction.play();

    currentActionRef.current = targetAction;

    console.log(`[Mascot3D] Playing animation: ${targetAnimation}`);

  }, [currentAnimation, actions, transitionDuration, loopAnimation]);

  // Update mixer on each frame
  useFrame((state, delta) => {
    mixer?.update(delta);
  });

  return (
    <group ref={group} dispose={null}>
      <primitive
        object={scene}
        scale={scale}
        position={position}
      />
    </group>
  );
});

MascotModel.displayName = 'MascotModel';

/**
 * Loading fallback component
 */
const LoadingFallback = () => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#00A0E3" wireframe />
    </mesh>
  );
};

/**
 * Main Mascot3D Container Component
 */
const Mascot3D = memo(({
  width = 200,
  height = 250,
  className = '',
  style = {},
  enableOrbitControls = false,
  backgroundColor = 'transparent',
  onLoaded,
}) => {
  const containerRef = useRef();
  const [isInView, setIsInView] = useState(true);
  const { isVisible } = useMascot();

  // Intersection Observer for visibility optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {isInView && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{
            antialias: true,
            alpha: backgroundColor === 'transparent',
            powerPreference: 'default',
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
          style={{ background: backgroundColor }}
          frameloop="always"
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          {/* Lighting Setup */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, 3, -5]} intensity={0.5} />

          {/* Model with Suspense */}
          <Suspense fallback={<LoadingFallback />}>
            <MascotModel onLoaded={onLoaded} />
          </Suspense>

          {/* Optional orbit controls for debugging */}
          {enableOrbitControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={2}
              maxDistance={8}
            />
          )}
        </Canvas>
      )}
    </div>
  );
});

Mascot3D.displayName = 'Mascot3D';

/**
 * Inline Mascot - For embedding next to content
 */
export const InlineMascot = memo(({
  size = 'medium',
  className = '',
  style = {},
  onLoaded,
}) => {
  const sizes = {
    small: { width: 120, height: 150 },
    medium: { width: 180, height: 220 },
    large: { width: 250, height: 300 },
  };

  const { width, height } = sizes[size] || sizes.medium;

  return (
    <Mascot3D
      width={width}
      height={height}
      className={`inline-block align-middle ${className}`}
      style={style}
      onLoaded={onLoaded}
    />
  );
});

InlineMascot.displayName = 'InlineMascot';

/**
 * Floating Mascot - For fixed position on screen with speech bubble support
 */
export const FloatingMascot = memo(({
  position = 'bottom-right',
  size = 'medium',
  className = '',
  onLoaded,
  speechBubble = null,
  showBubble = false,
  onBubbleDismiss,
  bottomOffset = 0,
}) => {
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [bubbleAnimating, setBubbleAnimating] = useState(false);

  // Persistent visibility state
  const [isMascotHidden, setIsMascotHidden] = useState(() => {
    const stored = sessionStorage.getItem('mascot_visibility_hidden');
    return stored === 'true';
  });

  const [isToggleHovered, setIsToggleHovered] = useState(false);

  const sizes = {
    small: { width: 100, height: 120 },
    medium: { width: 130, height: 160 },
    large: { width: 180, height: 220 },
  };

  const { width, height } = sizes[size] || sizes.medium;
  const isRightAligned = position.includes('right');

  // Handle visibility toggle with persistence
  const handleVisibilityToggle = useCallback(() => {
    setIsMascotHidden(prev => {
      const newValue = !prev;
      sessionStorage.setItem('mascot_visibility_hidden', String(newValue));
      return newValue;
    });
  }, []);

  // Handle speech bubble visibility
  useEffect(() => {
    if (showBubble && speechBubble) {
      setIsBubbleVisible(true);
      setBubbleAnimating(true);
    } else if (!showBubble && isBubbleVisible) {
      setBubbleAnimating(false);
      setTimeout(() => {
        setIsBubbleVisible(false);
        onBubbleDismiss?.();
      }, 300);
    }
  }, [showBubble, speechBubble, isBubbleVisible, onBubbleDismiss]);

  return (
    <div
      className={`fixed z-[1000] ${className}`}
      style={{
        bottom: "40vh",
        right: "5vh",
      }}
    >
      {/* Visibility Toggle Button */}
      <button
        className={`absolute -top-3 -right-1 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-all z-10 ${
          isMascotHidden
            ? 'bg-gray-400 hover:bg-gray-500'
            : 'bg-[#00A0E3] hover:bg-[#0080B8]'
        }`}
        onClick={handleVisibilityToggle}
        onMouseEnter={() => setIsToggleHovered(true)}
        onMouseLeave={() => setIsToggleHovered(false)}
        onFocus={() => setIsToggleHovered(true)}
        onBlur={() => setIsToggleHovered(false)}
        aria-label={isMascotHidden ? 'Show mascot' : 'Hide mascot'}
        title={isMascotHidden ? 'Show Mascot' : 'Hide Mascot'}
        type="button"
      >
        {isMascotHidden ? (
          <EyeOff className="w-4 h-4 text-white" />
        ) : (
          <Eye className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Speech Bubble */}
      {!isMascotHidden && isBubbleVisible && speechBubble && (
        <div
          className={`absolute bottom-full mb-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 max-w-[200px] cursor-pointer transition-all duration-300 ${
            isRightAligned ? 'right-0' : 'left-0'
          } ${bubbleAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          onClick={() => {
            setBubbleAnimating(false);
            setTimeout(() => {
              setIsBubbleVisible(false);
              onBubbleDismiss?.();
            }, 300);
          }}
        >
          <div className="flex items-start gap-2">
            {typeof speechBubble === 'string' ? (
              <span className="text-sm text-[#0B1120]">{speechBubble}</span>
            ) : (
              speechBubble
            )}
            <span className="text-gray-400 text-xs cursor-pointer hover:text-gray-600 flex-shrink-0">x</span>
          </div>
          <div
            className={`absolute -bottom-2 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45 ${
              isRightAligned ? 'right-6' : 'left-6'
            }`}
          />
        </div>
      )}

      {/* Mascot Container */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          isMascotHidden ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-[#00A0E3]/10 blur-xl" />
        <Mascot3D
          width={width}
          height={height}
          onLoaded={onLoaded}
        />
      </div>
    </div>
  );
});

FloatingMascot.displayName = 'FloatingMascot';

/**
 * Custom hook for managing speech bubbles
 */
export const useSpeechBubble = () => {
  const [currentBubble, setCurrentBubble] = useState(null);
  const [showBubble, setShowBubble] = useState(false);

  const showMessage = useCallback((message, duration = 4000) => {
    setCurrentBubble(message);
    setShowBubble(true);

    if (duration > 0) {
      setTimeout(() => {
        setShowBubble(false);
      }, duration);
    }
  }, []);

  const hideMessage = useCallback(() => {
    setShowBubble(false);
  }, []);

  return {
    currentBubble,
    showBubble,
    showMessage,
    hideMessage,
  };
};

export default Mascot3D;
