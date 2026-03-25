import { useState, useEffect } from 'react';

const FEEDBACK_STORAGE_KEY = 'feedback_auto_show';

/**
 * Hook to manage automatic feedback modal display
 * Shows the feedback modal only on the 2nd login
 *
 * @param {string} username - The current user's username
 * @returns {object} - { shouldShowFeedback, markFeedbackShown, resetFeedbackTracking }
 */
const useFeedbackAutoShow = (username) => {
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (username) {
      checkAndUpdateLoginCount();
    } else {
      setIsLoading(false);
    }
  }, [username]);

  const checkAndUpdateLoginCount = () => {
    try {
      const storageKey = `${FEEDBACK_STORAGE_KEY}_${username}`;
      const storedData = localStorage.getItem(storageKey);

      let feedbackData = storedData ? JSON.parse(storedData) : {
        loginCount: 0,
        feedbackShown: false,
      };

      // Increment login count
      feedbackData.loginCount += 1;

      // Check if this is the 2nd login and feedback hasn't been shown yet
      if (feedbackData.loginCount === 2 && !feedbackData.feedbackShown) {
        setShouldShowFeedback(true);
      } else {
        setShouldShowFeedback(false);
      }

      // Save updated data
      localStorage.setItem(storageKey, JSON.stringify(feedbackData));

      console.log(`📊 Feedback tracking for ${username}:`, feedbackData);
    } catch (error) {
      console.error('Error checking feedback auto-show:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markFeedbackShown = () => {
    if (!username) return;

    try {
      const storageKey = `${FEEDBACK_STORAGE_KEY}_${username}`;
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        const feedbackData = JSON.parse(storedData);
        feedbackData.feedbackShown = true;
        localStorage.setItem(storageKey, JSON.stringify(feedbackData));
        setShouldShowFeedback(false);
        console.log('✅ Feedback marked as shown');
      }
    } catch (error) {
      console.error('Error marking feedback as shown:', error);
    }
  };

  // Utility function to reset tracking (for testing)
  const resetFeedbackTracking = () => {
    if (!username) return;

    try {
      const storageKey = `${FEEDBACK_STORAGE_KEY}_${username}`;
      localStorage.removeItem(storageKey);
      console.log('🔄 Feedback tracking reset for', username);
    } catch (error) {
      console.error('Error resetting feedback tracking:', error);
    }
  };

  return {
    shouldShowFeedback,
    isLoading,
    markFeedbackShown,
    resetFeedbackTracking,
  };
};

export default useFeedbackAutoShow;
