'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FABContextType {
  onCreateNote?: () => void;
  setCreateNoteHandler: (handler?: () => void) => void;
}

const FABContext = createContext<FABContextType | undefined>(undefined);

export const FABProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onCreateNote, setOnCreateNote] = useState<(() => void) | undefined>(undefined);

  const setCreateNoteHandler = (handler?: () => void) => {
    setOnCreateNote(() => handler);
  };

  return (
    <FABContext.Provider value={{ onCreateNote, setCreateNoteHandler }}>
      {children}
    </FABContext.Provider>
  );
};

export const useFAB = (): FABContextType => {
  const context = useContext(FABContext);
  if (!context) {
    throw new Error('useFAB must be used within a FABProvider');
  }
  return context;
};
