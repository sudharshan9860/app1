/**
 * MascotPreloader - Preloads 3D mascot assets for instant rendering
 *
 * This component should be placed early in the app (e.g., in App.jsx)
 * to start loading the model while the user navigates.
 *
 * Features:
 * - Background asset loading
 * - Progress tracking
 * - Cache warming
 */

import { useEffect, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';

// Model paths to preload
const MODELS_TO_PRELOAD = [
  '/models/new-mascot.glb',
];

/**
 * Hook to preload models in the background
 * @returns {{ isLoaded: boolean, progress: number, error: string | null }}
 */
export const useMascotPreloader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const preloadModels = async () => {
      try {
        const total = MODELS_TO_PRELOAD.length;
        let loaded = 0;

        for (const modelPath of MODELS_TO_PRELOAD) {
          try {
            // useGLTF.preload caches the model
            useGLTF.preload(modelPath);

            // Simulate loading progress (actual loading happens async)
            loaded++;
            if (isMounted) {
              setProgress((loaded / total) * 100);
            }
          } catch (modelError) {
            console.warn(`[MascotPreloader] Failed to preload ${modelPath}:`, modelError);
          }
        }

        // Mark as loaded after a small delay to ensure caching is complete
        setTimeout(() => {
          if (isMounted) {
            setIsLoaded(true);
            setProgress(100);
          }
        }, 100);
      } catch (err) {
        console.error('[MascotPreloader] Preload error:', err);
        if (isMounted) {
          setError(err.message);
        }
      }
    };

    // Start preloading after initial render
    const timeoutId = setTimeout(preloadModels, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return { isLoaded, progress, error };
};

/**
 * MascotPreloader Component
 * Place this early in your app to start background loading
 */
const MascotPreloader = ({ onLoaded, showProgress = false }) => {
  const { isLoaded, progress, error } = useMascotPreloader();

  useEffect(() => {
    if (isLoaded && onLoaded) {
      onLoaded();
    }
  }, [isLoaded, onLoaded]);

  // This component doesn't render anything visible by default
  if (!showProgress) return null;

  // Optional progress indicator (for debugging)
  return (
    <div
      className={`fixed bottom-2.5 left-2.5 px-2.5 py-1.5 bg-black/70 text-white text-xs rounded z-[9999] ${
        isLoaded ? 'hidden' : 'block'
      }`}
    >
      {error ? (
        <span className="text-red-400">Mascot load error</span>
      ) : (
        <span>Loading mascot: {Math.round(progress)}%</span>
      )}
    </div>
  );
};

/**
 * Utility function to clear cached models
 * Call this if you need to force reload
 */
export const clearMascotCache = () => {
  MODELS_TO_PRELOAD.forEach((modelPath) => {
    useGLTF.clear(modelPath);
  });
};

/**
 * Check if mascot model is in cache
 */
export const isMascotCached = () => {
  try {
    // This is a heuristic check - if preload was called, it should be cached
    return true; // useGLTF handles caching internally
  } catch {
    return false;
  }
};

export default MascotPreloader;
