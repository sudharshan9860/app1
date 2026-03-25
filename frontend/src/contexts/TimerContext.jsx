import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';

// Create context
export const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [studyTimeLog, setStudyTimeLog] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Use refs to avoid stale closure issues in interval
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(false);

  // Clear the interval
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start the interval
  const startInterval = useCallback(() => {
    // Clear any existing interval
    clearTimerInterval();

    // Only start if we have a valid start time
    if (startTimeRef.current !== null) {
      // Update immediately
      setElapsedTime(Date.now() - startTimeRef.current);

      // Then set up the interval
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null && isActiveRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 1000);
    }
  }, [clearTimerInterval]);

  // Start timer for a question
  const startTimer = useCallback((questionId) => {
    // Clear any existing interval first
    clearTimerInterval();

    // Set refs BEFORE setting state
    const now = Date.now();
    startTimeRef.current = now;
    isActiveRef.current = true;

    // Reset elapsed time and set state
    setElapsedTime(0);
    setCurrentQuestionId(questionId);
    setIsTimerActive(true);

    // Start the interval immediately (synchronously)
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null && isActiveRef.current) {
        setElapsedTime(Date.now() - startTimeRef.current);
      }
    }, 1000);
  }, [clearTimerInterval]);

  // Reset timer without stopping (for question changes)
  const resetTimer = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    setElapsedTime(0);
  }, []);

  // Stop timer and record time spent
  const stopTimer = useCallback(() => {
    // Clear the interval immediately
    clearTimerInterval();

    const startTime = startTimeRef.current;
    const questionId = currentQuestionId;

    // Calculate time spent
    let timeSpent = 0;
    if (startTime !== null) {
      timeSpent = Date.now() - startTime;

      // Add to study time log
      setStudyTimeLog(prev => [
        ...prev,
        {
          questionId: questionId,
          startTime: startTime,
          endTime: Date.now(),
          timeSpentMs: timeSpent,
        }
      ]);
    }

    // Reset all state and refs
    isActiveRef.current = false;
    startTimeRef.current = null;
    setIsTimerActive(false);
    setCurrentQuestionId(null);
    setElapsedTime(0);

    return timeSpent;
  }, [currentQuestionId, clearTimerInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  // Get total study time for the day
  const getTotalStudyTimeForDay = useCallback((date = new Date()) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return studyTimeLog
      .filter(log => {
        const logDate = new Date(log.startTime);
        return logDate >= startOfDay && logDate <= endOfDay;
      })
      .reduce((total, log) => total + log.timeSpentMs, 0);
  }, [studyTimeLog]);

  // Get total study time for all sessions
  const getTotalStudyTime = useCallback(() => {
    return studyTimeLog.reduce((total, log) => total + log.timeSpentMs, 0);
  }, [studyTimeLog]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    isTimerActive,
    currentQuestionId,
    studyTimeLog,
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    getTotalStudyTimeForDay,
    getTotalStudyTime
  }), [isTimerActive, currentQuestionId, studyTimeLog, elapsedTime, startTimer, stopTimer, resetTimer, getTotalStudyTimeForDay, getTotalStudyTime]);

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};

// Custom hook for using the timer context
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
