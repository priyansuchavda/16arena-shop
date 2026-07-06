"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone, Loader2 } from "lucide-react";
import { useRequestOtp, useGoogleLogin, useRequestEmailOtp } from "../hooks/useAuth";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const requestOtpMutation = useRequestOtp();
  const requestEmailOtpMutation = useRequestEmailOtp();
  const googleLoginMutation = useGoogleLogin();

  const returnUrl = searchParams.get("returnUrl") || "/shop";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let token = "";
      if (loginMode === "phone") {
        if (phone.length < 10) return;
        const response = await requestOtpMutation.mutateAsync(phone);
        token =
          response?.otpToken ||
          response?.data?.otpToken ||
          (typeof response === "string" ? response : "");
        router.replace(
          `/verify-otp?phone=${encodeURIComponent(phone)}&token=${encodeURIComponent(
            token
          )}&returnUrl=${encodeURIComponent(returnUrl)}`
        );
      } else {
        if (!emailValid) return;
        const response = await requestEmailOtpMutation.mutateAsync(email);
        token =
          response?.otpToken ||
          response?.data?.otpToken ||
          (typeof response === "string" ? response : "");
        router.replace(
          `/verify-otp?email=${encodeURIComponent(email)}&token=${encodeURIComponent(
            token
          )}&returnUrl=${encodeURIComponent(returnUrl)}`
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP.";
      setError(msg);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const storedFcmToken =
        typeof window !== "undefined" ? localStorage.getItem("fcm_token") || undefined : undefined;
      const response = await googleLoginMutation.mutateAsync(storedFcmToken);
      const data = response?.data || response;
      const isComplete = data?.isProfileComplete ?? !!data?.user?.displayName;

      if (!isComplete) {
        router.replace(`/register?returnUrl=${encodeURIComponent(returnUrl)}`);
      } else {
        router.replace(returnUrl);
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const isValid = loginMode === "phone" ? phone.length === 10 : emailValid;
  const isPending = requestOtpMutation.isPending || requestEmailOtpMutation.isPending;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[var(--line)] bg-[#121212]/90 p-8 backdrop-blur-md shadow-2xl">
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #fe8321, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #ff973c, transparent 70%)" }}
      />

      <div className="relative mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          {loginMode === "phone"
            ? "Enter your phone number to continue"
            : "Enter your email address to continue"}
        </p>
      </div>

      <form onSubmit={handleRequestOtp} className="relative z-10 flex flex-col gap-4">
        {loginMode === "phone" ? (
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-4 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm font-semibold whitespace-nowrap">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-white transition"
                maxLength={10}
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-white transition"
              autoFocus
            />
          </div>
        )}

        {error && <div className="text-xs font-semibold text-red-500 mb-2">{error}</div>}

        <SlantedButton
          type="submit"
          disabled={!isValid}
          isLoading={isPending}
          className="w-full"
        >
          Send OTP
        </SlantedButton>

        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="mx-4 text-xs font-bold text-white/20 uppercase tracking-wider">or</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => {
            setLoginMode(loginMode === "phone" ? "email" : "phone");
            setError("");
          }}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-white/[0.03] text-white text-sm font-semibold transition active:scale-95 mb-1"
        >
          {loginMode === "phone" ? (
            <>
              <Mail className="w-4 h-4" />
              Continue with Email
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Continue with Phone
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoginMutation.isPending}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-white/[0.03] text-white text-sm font-semibold transition active:scale-95"
        >
          {googleLoginMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--flame)]" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
          )}
          {googleLoginMutation.isPending ? "Connecting..." : "Continue with Google"}
        </button>
      </form>
    </div>
  );
};
