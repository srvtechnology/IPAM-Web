"use client";

import React, { createContext, useContext, useState } from "react";

export interface PublicSessionUser {
  id: string;
  email: string;
  studentId: string;
  isVerifiedAlumni: boolean;
  membershipTier: string;
  profile: {
    id: string;
    name: string;
    avatar: string | null;
    classYear: number;
    degree: string;
    major: string;
  } | null;
}

interface AppContextType {
  session: PublicSessionUser | null;

  isPostJobOpen: boolean;
  setIsPostJobOpen: (open: boolean) => void;
  isSubmitBusinessOpen: boolean;
  setIsSubmitBusinessOpen: (open: boolean) => void;
  infoModalType: "privacy" | "terms" | "contact" | "bylaws" | null;
  setInfoModalType: (type: "privacy" | "terms" | "contact" | "bylaws" | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialSession: PublicSessionUser | null;
}> = ({ children, initialSession }) => {
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isSubmitBusinessOpen, setIsSubmitBusinessOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<AppContextType["infoModalType"]>(null);

  return (
    <AppContext.Provider
      value={{
        session: initialSession,
        isPostJobOpen,
        setIsPostJobOpen,
        isSubmitBusinessOpen,
        setIsSubmitBusinessOpen,
        infoModalType,
        setInfoModalType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
