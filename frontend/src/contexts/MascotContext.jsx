/**
 * MascotContext - Global state management for 3D Mascot
 * Handles animation states, preloading status, and cross-component communication
 *
 * @author Senior Engineer Implementation
 * @version 2.0.0
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Animation constants - matches NLA actions in the GLB file
export const MASCOT_ANIMATIONS = {
  T_POSE: 't-pose',
  EXPLAIN: 'explain',
  VICTORY: 'victory',
  SAD: 'sad',
  HIPHOP: 'hiphop',
  SALSA: 'salsa',
  LOOK_RIGHT: 'look-right',
  DEFEATED: 'defeated',
  ROLL: 'roll',
  SAD2: 'sad2',
  JUMP: 'jump',
};

// Animation categories for semantic usage
export const ANIMATION_CATEGORIES = {
  IDLE: [MASCOT_ANIMATIONS.T_POSE, MASCOT_ANIMATIONS.LOOK_RIGHT],
  HAPPY: [MASCOT_ANIMATIONS.VICTORY, MASCOT_ANIMATIONS.HIPHOP, MASCOT_ANIMATIONS.SALSA, MASCOT_ANIMATIONS.JUMP],
  SAD: [MASCOT_ANIMATIONS.SAD, MASCOT_ANIMATIONS.SAD2, MASCOT_ANIMATIONS.DEFEATED],
  TEACHING: [MASCOT_ANIMATIONS.EXPLAIN],
  CELEBRATION: [MASCOT_ANIMATIONS.VICTORY, MASCOT_ANIMATIONS.HIPHOP],
};

// Score thresholds for animation selection
const SCORE_THRESHOLDS = {
  EXCELLENT: 80, // Victory + celebration
  GOOD: 60,      // Happy animations
  AVERAGE: 40,   // Neutral/explaining
  POOR: 0,       // Sad animations
};

const MascotContext = createContext(null);

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (!context) {
    // Return a no-op context if not within provider (prevents errors during SSR/testing)
    return {
      currentAnimation: MASCOT_ANIMATIONS.T_POSE,
      isLoaded: false,
      isVisible: true,
      transitionDuration: 0.3,
      loopAnimation: true,
      setIsLoaded: () => {},
      setIsVisible: () => {},
      playAnimation: () => {},
      queueAnimations: () => {},
      getRandomFromCategory: () => MASCOT_ANIMATIONS.T_POSE,
      playScoreAnimation: () => {},
      playActionAnimation: () => {},
      setIdle: () => {},
      setThinking: () => {},
      setExplaining: () => {},
      setCelebrating: () => {},
      setSad: () => {},
      setEncouraging: () => {},
      setDancing: () => {},
      ANIMATIONS: MASCOT_ANIMATIONS,
      CATEGORIES: ANIMATION_CATEGORIES,
    };
  }
  return context;
};

export const MascotProvider = ({ children }) => {
  // Current animation state
  const [currentAnimation, setCurrentAnimation] = useState(MASCOT_ANIMATIONS.T_POSE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [animationQueue, setAnimationQueue] = useState([]);

  // Animation transition settings
  const [transitionDuration, setTransitionDuration] = useState(0.3);
  const [loopAnimation, setLoopAnimation] = useState(true);

  // Refs for animation timing
  const animationTimeoutRef = useRef(null);
  const queueProcessingRef = useRef(false);

  // Process animation queue
  useEffect(() => {
    if (animationQueue.length > 0 && !queueProcessingRef.current) {
      queueProcessingRef.current = true;
      const nextAnim = animationQueue[0];

      setCurrentAnimation(nextAnim.animation);

      if (nextAnim.duration && nextAnim.duration > 0) {
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationQueue(prev => prev.slice(1));
          queueProcessingRef.current = false;

          // Return to idle if queue is empty
          if (animationQueue.length <= 1) {
            setCurrentAnimation(MASCOT_ANIMATIONS.T_POSE);
          }
        }, nextAnim.duration);
      } else {
        setAnimationQueue(prev => prev.slice(1));
        queueProcessingRef.current = false;
      }
    }
  }, [animationQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Play a specific animation
   * @param {string} animation - Animation name from MASCOT_ANIMATIONS
   * @param {object} options - { duration, loop, transition }
   */
  const playAnimation = useCallback((animation, options = {}) => {
    const { duration = 0, loop = true, transition = 0.3 } = options;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setTransitionDuration(transition);
    setLoopAnimation(loop);
    setCurrentAnimation(animation);

    if (duration > 0 && !loop) {
      animationTimeoutRef.current = setTimeout(() => {
        setCurrentAnimation(MASCOT_ANIMATIONS.T_POSE);
        setLoopAnimation(true);
      }, duration);
    }
  }, []);

  /**
   * Queue multiple animations to play in sequence
   * @param {Array} animations - Array of { animation, duration } objects
   */
  const queueAnimations = useCallback((animations) => {
    setAnimationQueue(animations);
  }, []);

  /**
   * Get random animation from a category
   * @param {string} category - Category key from ANIMATION_CATEGORIES
   */
  const getRandomFromCategory = useCallback((category) => {
    const animations = ANIMATION_CATEGORIES[category];
    if (!animations || animations.length === 0) return MASCOT_ANIMATIONS.T_POSE;
    return animations[Math.floor(Math.random() * animations.length)];
  }, []);

  /**
   * Play animation based on score (for ResultPage)
   * @param {number} score - Score percentage (0-100)
   * @param {number} total - Total possible score
   */
  const playScoreAnimation = useCallback((obtained, total) => {
    const percentage = total > 0 ? (obtained / total) * 100 : 0;

    let animation;
    let duration = 3000;

    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      // Excellent - Victory celebration
      animation = MASCOT_ANIMATIONS.SALSA;
      duration = 4000;
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      // Good - Happy jump
      animation = MASCOT_ANIMATIONS.HIPHOP;
      duration = 3000;
    } else if (percentage >= SCORE_THRESHOLDS.AVERAGE) {
      // Average - Explaining (encouraging)
      animation = MASCOT_ANIMATIONS.SAD;
      duration = 3000;
    } else {
      // Poor - Sad but supportive
      animation = MASCOT_ANIMATIONS.SAD;
      duration = 2500;
    }

    playAnimation(animation, { duration, loop: true });

    return { animation, percentage };
  }, [playAnimation]);

  /**
   * Play animation for action type (for ResultPage based on action)
   * @param {string} actionType - 'solve', 'explain', 'correct', 'submit'
   */
  const playActionAnimation = useCallback((actionType) => {
    switch (actionType) {
      case 'explain':
        playAnimation(MASCOT_ANIMATIONS.EXPLAIN, { loop: true });
        break;
      case 'solve':
        playAnimation(MASCOT_ANIMATIONS.EXPLAIN, { loop: true });
        break;
      case 'correct':
        // Will be overridden by score animation
        playAnimation(MASCOT_ANIMATIONS.LOOK_RIGHT, { loop: true });
        break;
      case 'submit':
        playAnimation(MASCOT_ANIMATIONS.LOOK_RIGHT, { loop: true });
        break;
      default:
        playAnimation(MASCOT_ANIMATIONS.T_POSE, { loop: true });
    }
  }, [playAnimation]);

  // Semantic animation helpers
  const setIdle = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.T_POSE, { loop: true });
  }, [playAnimation]);

  const setThinking = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.LOOK_RIGHT, { loop: true });
  }, [playAnimation]);

  const setExplaining = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.EXPLAIN, { loop: true });
  }, [playAnimation]);

  const setCelebrating = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.VICTORY, { loop: true });
  }, [playAnimation]);

  const setSad = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.SAD, { loop: true });
  }, [playAnimation]);

  const setEncouraging = useCallback(() => {
    playAnimation(MASCOT_ANIMATIONS.EXPLAIN, { loop: true });
  }, [playAnimation]);

  const setDancing = useCallback(() => {
    const danceAnims = [MASCOT_ANIMATIONS.HIPHOP, MASCOT_ANIMATIONS.SALSA];
    playAnimation(danceAnims[Math.floor(Math.random() * danceAnims.length)], { loop: true });
  }, [playAnimation]);

  const value = {
    // State
    currentAnimation,
    isLoaded,
    isVisible,
    transitionDuration,
    loopAnimation,

    // Setters
    setIsLoaded,
    setIsVisible,

    // Animation controls
    playAnimation,
    queueAnimations,
    getRandomFromCategory,

    // Score/Action based animations
    playScoreAnimation,
    playActionAnimation,

    // Semantic helpers
    setIdle,
    setThinking,
    setExplaining,
    setCelebrating,
    setSad,
    setEncouraging,
    setDancing,

    // Constants
    ANIMATIONS: MASCOT_ANIMATIONS,
    CATEGORIES: ANIMATION_CATEGORIES,
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
};

export default MascotContext;
