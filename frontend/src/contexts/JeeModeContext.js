// src/contexts/JeeModeContext.js
import React, { createContext, useContext, useState } from 'react';

const JeeModeContext = createContext();

export const JeeModeProvider = ({ children }) => {
  const [isJeeMode, setIsJeeMode] = useState(false);

  return (
    <JeeModeContext.Provider value={{ isJeeMode, setIsJeeMode }}>
      {children}
    </JeeModeContext.Provider>
  );
};

export const useJeeMode = () => {
  const context = useContext(JeeModeContext);
  if (!context) {
    throw new Error('useJeeMode must be used within JeeModeProvider');
  }
  return context;
};