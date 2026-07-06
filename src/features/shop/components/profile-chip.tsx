"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Edit2, User, ChevronDown, ClipboardList } from "lucide-react";
import { useAuthStore, useUserSummary, useLogout } from "@/features/auth";

const DEFAULT_AVATAR_URL =
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_2-min.jpg";

/** Circular avatar — white ring, dark border, profile photo. */
export function ProfileAvatar({ src = DEFAULT_AVATAR_URL }: { src?: string }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3d2814] p-[2.5px] ring-1 ring-white/95">
      <span className="relative h-full w-full overflow-hidden rounded-full">
        <Image src={src || DEFAULT_AVATAR_URL} alt="" fill className="object-cover" sizes="40px" priority />
      </span>
    </span>
  );
}

/** Brown pill badge — avatar left, name right. Matches SWAG top-bar profile chip. */
export function ProfileChip() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const { data: userSummary } = useUserSummary();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="shop-pill group inline-flex h-[42px] shrink-0 items-center border border-[#a67c52]/65 bg-[#6b4423] py-0 pl-0.5 pr-3.5 shadow-[inset_0_1px_0_rgba(255,200,120,0.08)] transition hover:brightness-110 animate-fade-in"
      >
        <ProfileAvatar src={DEFAULT_AVATAR_URL} />
        <span className="ml-2 max-w-[8rem] truncate text-[13px] font-bold leading-none text-white">
          Sign In
        </span>
      </Link>
    );
  }

  const displayName = userSummary?.displayName || user?.displayName || user?.username || "Player";
  const avatarUrl = userSummary?.avatarUrl || user?.avatarUrl || user?.photoURL || DEFAULT_AVATAR_URL;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="shop-pill group inline-flex h-[42px] shrink-0 items-center border border-[#a67c52]/65 bg-[#6b4423] py-0 pl-0.5 pr-3.5 shadow-[inset_0_1px_0_rgba(255,200,120,0.08)] transition hover:brightness-110 focus:outline-none"
      >
        <ProfileAvatar src={avatarUrl} />
        <span className="ml-2 max-w-[8rem] truncate text-[13px] font-bold leading-none text-white">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-white/50 ml-1.5 transition-transform group-hover:text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[20px] border border-[var(--line)] bg-[#0c0c0c] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-[var(--line)] bg-[#141414] text-center">
            <div className="relative w-14 h-14 mx-auto mb-2">
              <ProfileAvatar src={avatarUrl} />
              <Link
                href="/register?returnUrl=/shop"
                onClick={() => setIsOpen(false)}
                className="absolute bottom-0 right-0 bg-[var(--flame)] p-1.5 rounded-full cursor-pointer hover:brightness-110 transition shadow-lg flex items-center justify-center w-6 h-6 border border-[#0c0c0c]"
              >
                <Edit2 className="w-2.5 h-2.5 text-[#0c0c0c]" />
              </Link>
            </div>
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--muted)] truncate font-mono mt-0.5">
              {user.phoneNumber || user.email || `@${user.username}`}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/register?returnUrl=/shop"
              className="flex items-center px-4 py-2.5 text-xs font-semibold text-[var(--muted)] hover:bg-white/[0.03] hover:text-white transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-3.5 h-3.5 mr-2.5 text-[var(--flame)]" />
              Edit Profile
            </Link>
            <Link
              href="/orders"
              className="flex items-center px-4 py-2.5 text-xs font-semibold text-[var(--muted)] hover:bg-white/[0.03] hover:text-white transition"
              onClick={() => setIsOpen(false)}
            >
              <ClipboardList className="w-3.5 h-3.5 mr-2.5 text-[var(--flame)]" />
              Order History
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-left"
            >
              <LogOut className="w-3.5 h-3.5 mr-2.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
