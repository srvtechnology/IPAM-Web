"use client";

import { useApp } from "@/lib/public/context";
import VirtualIdModal from "@/components/public/VirtualIdModal";

export default function GlobalVirtualIdModal() {
  const { session, isPassModalOpen, setIsPassModalOpen, passModalTab } = useApp();

  if (!isPassModalOpen || !session?.profile) return null;

  return (
    <VirtualIdModal
      session={session}
      initialTab={passModalTab}
      onClose={() => setIsPassModalOpen(false)}
    />
  );
}
