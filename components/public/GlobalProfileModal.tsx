"use client";

import { useApp } from "@/lib/public/context";
import ProfileManagementModal from "@/components/public/ProfileManagementModal";

export default function GlobalProfileModal() {
  const { session, isProfileModalOpen, setIsProfileModalOpen } = useApp();

  if (!session) return null;

  return (
    <ProfileManagementModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
    />
  );
}
