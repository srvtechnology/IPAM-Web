"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface PublicSessionUser {
  id: string;
  email: string;
  studentId: string;
  isVerifiedAlumni: boolean;
  membershipTier: string;
  savedJobsCount: number;
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
  setSession: (session: PublicSessionUser | null | ((prev: PublicSessionUser | null) => PublicSessionUser | null)) => void;
  refreshSession: () => Promise<void>;

  isPostJobOpen: boolean;
  setIsPostJobOpen: (open: boolean) => void;
  isSubmitBusinessOpen: boolean;
  setIsSubmitBusinessOpen: (open: boolean) => void;
  infoModalType: "privacy" | "terms" | "contact" | "bylaws" | null;
  setInfoModalType: (type: "privacy" | "terms" | "contact" | "bylaws" | null) => void;

  isPassModalOpen: boolean;
  setIsPassModalOpen: (open: boolean) => void;
  passModalTab: "virtual" | "qr" | "order";
  setPassModalTab: (tab: "virtual" | "qr" | "order") => void;

  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialSession: PublicSessionUser | null;
}> = ({ children, initialSession }) => {
  const [session, setSession] = useState<PublicSessionUser | null>(initialSession);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isSubmitBusinessOpen, setIsSubmitBusinessOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<AppContextType["infoModalType"]>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passModalTab, setPassModalTab] = useState<AppContextType["passModalTab"]>("virtual");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/alumni/me");
      if (res.ok) {
        const json = await res.json();
        const u = json.data || json;
        if (u && u.id) {
          setSession((prev) => ({
            id: u.id,
            email: u.email,
            studentId: u.studentId,
            isVerifiedAlumni: u.isVerifiedAlumni,
            membershipTier: u.membershipTier,
            savedJobsCount: prev?.savedJobsCount ?? 0,
            profile: u.profile
              ? {
                  id: u.profile.id,
                  name: u.profile.name,
                  avatar: u.profile.avatar,
                  classYear: u.profile.classYear,
                  degree: u.profile.degree,
                  major: u.profile.major,
                }
              : null,
          }));
        }
      }
    } catch {
      // silently ignore network issues on refresh
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        refreshSession,
        isPostJobOpen,
        setIsPostJobOpen,
        isSubmitBusinessOpen,
        setIsSubmitBusinessOpen,
        infoModalType,
        setInfoModalType,
        isPassModalOpen,
        setIsPassModalOpen,
        passModalTab,
        setPassModalTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
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
