import { useContext } from 'react';
import { soundManager, SOUND_TYPES } from '../utils/SoundManager';
import { ProgressContext } from '../contexts/ProgressContext';

export const useSoundFeedback = () => {
  const { getProgressSummary } = useContext(ProgressContext);

  // Play sound for question solving
  const playQuestionSolvedSound = (isCorrect, accuracy) => {
    if (isCorrect) {
      soundManager.play(SOUND_TYPES.CORRECT_ANSWER);
      
      // Check for special achievements
      if (accuracy >= 100) {
        soundManager.playRandomCelebration();
      }
    } else {
      soundManager.play(SOUND_TYPES.WRONG_ANSWER);
    }
  };

  // Play sound for chapter completion
  const playChapterCompletedSound = () => {
    soundManager.play(SOUND_TYPES.CHAPTER_COMPLETED);
    soundManager.playRandomCelebration();
  };

  // Play sound for achievement
  const playAchievementSound = () => {
    soundManager.play(SOUND_TYPES.ACHIEVEMENT_UNLOCKED);
  };

  // Play sound for top rank
  const playTopRankSound = () => {
    soundManager.play(SOUND_TYPES.TOP_RANK);
  };

  // Play sound for streak bonus
  const playStreakBonusSound = (streak) => {
    if (streak % 7 === 0) {  // Every week of streak
      soundManager.play(SOUND_TYPES.STREAK_BONUS);
    }
  };

  return {
    playQuestionSolvedSound,
    playChapterCompletedSound,
    playAchievementSound,
    playTopRankSound,
    playStreakBonusSound
  };
};