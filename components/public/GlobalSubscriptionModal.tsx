"use client";

import { useApp } from "@/lib/public/context";
import SubscriptionManagementModal from "@/components/public/SubscriptionManagementModal";

export default function GlobalSubscriptionModal() {
  const { session, isSubscriptionModalOpen, setIsSubscriptionModalOpen } = useApp();

  if (!session) return null;

  return (
    <SubscriptionManagementModal
      isOpen={isSubscriptionModalOpen}
      onClose={() => setIsSubscriptionModalOpen(false)}
    />
  );
}
