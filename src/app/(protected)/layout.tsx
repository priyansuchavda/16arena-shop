"use client";

import React from "react";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
