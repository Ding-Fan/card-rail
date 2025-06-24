'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FABContextType {
  onCreateNote?: () => void;
  onCreateSubnote?: () => void;
  setCreateNoteHandler: (handler?: () => void) => void;
  setCreateSubnoteHandler: (handler?: () => void) => void;
  isInNoteView: boolean;
  setIsInNoteView: (inNoteView: boolean) => void;
}

const FABContext = createContext<FABContextType | undefined>(undefined);

export const FABProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onCreateNote, setOnCreateNote] = useState<(() => void) | undefined>(undefined);
  const [onCreateSubnote, setOnCreateSubnote] = useState<(() => void) | undefined>(undefined);
  const [isInNoteView, setIsInNoteView] = useState(false);

  const setCreateNoteHandler = (handler?: () => void) => {
    setOnCreateNote(() => handler);
  };

  const setCreateSubnoteHandler = (handler?: () => void) => {
    setOnCreateSubnote(() => handler);
  };

  return (
    <FABContext.Provider value={{
      onCreateNote,
      onCreateSubnote,
      setCreateNoteHandler,
      setCreateSubnoteHandler,
      isInNoteView,
      setIsInNoteView
    }}>
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
