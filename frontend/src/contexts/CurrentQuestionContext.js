import React, { createContext, useContext, useState } from 'react';

const CurrentQuestionContext = createContext();

export function CurrentQuestionProvider({ children }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionList, setQuestionList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionMetadata, setQuestionMetadata] = useState({});
  const [includeQuestionContext, setIncludeQuestionContext] = useState(false);

  const setQuestion = (question, index = 0, list = [], metadata = {}) => {
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setQuestionList(list);
    setQuestionMetadata(metadata);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionList.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questionList[nextIndex]);
      return questionList[nextIndex];
    }
    return null;
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(questionList[prevIndex]);
      return questionList[prevIndex];
    }
    return null;
  };

  const clearQuestion = () => {
    setCurrentQuestion(null);
    setQuestionList([]);
    setCurrentQuestionIndex(0);
    setQuestionMetadata({});
  };

  const contextValue = {
    currentQuestion,
    questionList,
    currentQuestionIndex,
    questionMetadata,
    setQuestion,
    setCurrentQuestion,
    nextQuestion,
    previousQuestion,
    clearQuestion,
    includeQuestionContext,
    setIncludeQuestionContext,
  };

  return (
    <CurrentQuestionContext.Provider value={contextValue}>
      {children}
    </CurrentQuestionContext.Provider>
  );
}

export function useCurrentQuestion() {
  const context = useContext(CurrentQuestionContext);
  if (!context) {
    throw new Error('useCurrentQuestion must be used within a CurrentQuestionProvider');
  }
  return context;
}