"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminSession } from "@/lib/admin/context";
import type { AlumniRecordRow } from "./AlumniDirectoryView";

interface AlumniActionDropdownProps {
  record: AlumniRecordRow;
  canApprove: boolean;
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInspect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
}

export default function AlumniActionDropdown({
  record,
  canApprove,
  loading,
  isOpen,
  onToggle,
  onClose,
  onInspect,
  onApprove,
  onReject,
  onMarkPending,
}: AlumniActionDropdownProps) {
  const { theme } = useAdminSession();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  }>({ right: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate and update fixed position when opening
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220;

      setPosition({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    updatePosition();

    // Close menu when scrolling or resizing to prevent detached floating menu
    function handleScrollOrResize() {
      onClose();
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-flex items-center justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body-compact text-xs transition-all duration-150 shadow-xs select-none ${
          isOpen
            ? "border-primary/60 bg-surface-container-high text-primary ring-1 ring-primary/40"
            : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:border-outline-variant/60"
        } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Actions"
      >
        <span>Actions</span>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            data-admin-theme={theme}
            style={{
              position: "fixed",
              top: position.top !== undefined ? `${position.top}px` : undefined,
              bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
              right: `${position.right}px`,
              zIndex: 9999,
              backgroundColor: theme === "light" ? "#ffffff" : "#1a2236",
            }}
            className="w-56 rounded-xl border border-outline-variant/40 bg-surface-container-highest p-1.5 shadow-2xl shadow-black/80 text-left transition-all animate-in fade-in-0 zoom-in-95 duration-100"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1.5 border-b border-outline-variant/15 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                Record Actions
              </p>
              <p className="text-xs font-semibold text-on-surface truncate">{record.name}</p>
            </div>

            {/* Inspect Action */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                onInspect();
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left font-body-compact text-xs text-on-surface hover:bg-primary/15 hover:text-primary transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-primary group-hover:scale-110 transition-transform">
                visibility
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Inspect Record</div>
                <div className="text-[10px] text-on-surface-variant/70">View details & verification</div>
              </div>
            </button>

            {canApprove && (
              <>
                <div className="my-1 border-t border-outline-variant/15" />

                {/* Approve Action */}
                {record.status !== "APPROVED" && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loading}
                    onClick={() => {
                      onClose();
                      onApprove();
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left font-body-compact text-xs text-on-surface hover:bg-secondary/15 hover:text-secondary transition-colors group disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary group-hover:scale-110 transition-transform">
                      check_circle
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Approve</div>
                      <div className="text-[10px] text-on-surface-variant/70">Sign off registration</div>
                    </div>
                  </button>
                )}

                {/* Reject Action */}
                {record.status !== "REJECTED" && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loading}
                    onClick={() => {
                      onClose();
                      onReject();
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left font-body-compact text-xs text-on-surface hover:bg-error/15 hover:text-error transition-colors group disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px] text-error group-hover:scale-110 transition-transform">
                      block
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Reject...</div>
                      <div className="text-[10px] text-on-surface-variant/70">With rejection reason</div>
                    </div>
                  </button>
                )}

                {/* Mark Pending Action */}
                {record.status !== "PENDING" && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loading}
                    onClick={() => {
                      onClose();
                      onMarkPending();
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left font-body-compact text-xs text-on-surface hover:bg-tertiary/15 hover:text-tertiary transition-colors group disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px] text-tertiary group-hover:scale-110 transition-transform">
                      pending
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Mark as Pending</div>
                      <div className="text-[10px] text-on-surface-variant/70">Revert to review queue</div>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
