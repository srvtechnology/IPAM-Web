"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  refreshSession: () => Promise<PublicSessionUser | null>;
  loginWithSession: (userData: any) => void;
  logout: () => Promise<void>;
  updateSessionProfile: (profileData: Partial<NonNullable<PublicSessionUser["profile"]>>) => void;
  updateSavedJobsCount: (updater: number | ((prev: number) => number)) => void;

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

function normalizeSessionUser(u: any, prevSavedJobs?: number): PublicSessionUser | null {
  if (!u || !u.id) return null;
  return {
    id: u.id,
    email: u.email,
    studentId: u.studentId,
    isVerifiedAlumni: Boolean(u.isVerifiedAlumni),
    membershipTier: u.membershipTier || "BASIC",
    savedJobsCount:
      typeof u.savedJobsCount === "number"
        ? u.savedJobsCount
        : typeof prevSavedJobs === "number"
        ? prevSavedJobs
        : 0,
    profile: u.profile
      ? {
          id: u.profile.id,
          name: u.profile.name,
          avatar: u.profile.avatar ?? null,
          classYear: u.profile.classYear,
          degree: u.profile.degree,
          major: u.profile.major,
        }
      : null,
  };
}

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialSession: PublicSessionUser | null;
}> = ({ children, initialSession }) => {
  const router = useRouter();
  const [session, setSession] = useState<PublicSessionUser | null>(initialSession);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isSubmitBusinessOpen, setIsSubmitBusinessOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<AppContextType["infoModalType"]>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passModalTab, setPassModalTab] = useState<AppContextType["passModalTab"]>("virtual");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Sync session with server layout changes (e.g. on server re-render / router.refresh())
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  const refreshSession = useCallback(async (): Promise<PublicSessionUser | null> => {
    try {
      const res = await fetch("/api/auth/alumni/me");
      if (res.ok) {
        const json = await res.json();
        const u = json.data || json;
        if (u && u.id) {
          let updated: PublicSessionUser | null = null;
          setSession((prev) => {
            updated = normalizeSessionUser(u, prev?.savedJobsCount);
            return updated;
          });
          return updated;
        }
      } else if (res.status === 401 || res.status === 403) {
        setSession(null);
        return null;
      }
    } catch {
      // silently ignore network issues on refresh
    }
    return null;
  }, []);

  const loginWithSession = useCallback((u: any) => {
    const normalized = normalizeSessionUser(u);
    if (normalized) {
      setSession(normalized);
      try {
        localStorage.setItem("ipam_auth_sync", Date.now().toString());
        window.dispatchEvent(new CustomEvent("ipam-auth-changed"));
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/alumni/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setSession(null);
    try {
      localStorage.setItem("ipam_auth_sync", Date.now().toString());
      window.dispatchEvent(new CustomEvent("ipam-auth-changed"));
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  }, [router]);

  const updateSessionProfile = useCallback(
    (profileData: Partial<NonNullable<PublicSessionUser["profile"]>>) => {
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: prev.profile ? { ...prev.profile, ...profileData } : null,
        };
      });
    },
    []
  );

  const updateSavedJobsCount = useCallback((updater: number | ((prev: number) => number)) => {
    setSession((prev) => {
      if (!prev) return null;
      const newCount = typeof updater === "function" ? updater(prev.savedJobsCount) : updater;
      return { ...prev, savedJobsCount: Math.max(0, newCount) };
    });
  }, []);

  // Multi-tab sync via storage & window events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ipam_auth_sync") {
        refreshSession();
      }
    };
    const handleCustom = () => {
      refreshSession();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("ipam-auth-changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ipam-auth-changed", handleCustom);
    };
  }, [refreshSession]);

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        refreshSession,
        loginWithSession,
        logout,
        updateSessionProfile,
        updateSavedJobsCount,
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
