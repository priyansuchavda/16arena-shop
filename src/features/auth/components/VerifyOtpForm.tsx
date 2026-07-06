"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useVerifyOtp } from "../hooks/useAuth";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

export const VerifyOtpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";
  const otpToken = searchParams.get("token") || "";
  const returnUrl = searchParams.get("returnUrl") || "/shop";

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyOtpMutation = useVerifyOtp();

  const performVerification = async (otpString: string) => {
    if (otpString.length < 4) return;
    setError("");
    try {
      const storedFcmToken =
        typeof window !== "undefined" ? localStorage.getItem("fcm_token") || undefined : undefined;
      const response = await verifyOtpMutation.mutateAsync({
        otpToken,
        otp: otpString,
        fcmToken: storedFcmToken,
      });
      const data = response?.data || response;
      const isComplete = data?.isProfileComplete ?? !!data?.user?.displayName;

      if (!isComplete) {
        router.replace(`/register?returnUrl=${encodeURIComponent(returnUrl)}`);
      } else {
        router.replace(returnUrl);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 404) {
        setError("Could not reach the server. Check your API URL and restart the dev server.");
      } else {
        setError(msg || "Invalid OTP. Please try again.");
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    await performVerification(otpString);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    const otpString = next.join("");
    if (otpString.length === 4) {
      performVerification(otpString);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted.length) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 3)]?.focus();

    const otpString = next.join("");
    if (otpString.length === 4) {
      performVerification(otpString);
    }
  };

  const otpValid = otp.join("").length >= 4;

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
        <h1 className="font-heading text-2xl font-extrabold text-white">Enter OTP</h1>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Code sent to <span className="text-white font-bold">{email ? email : `+91 ${phone}`}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyOtp} className="relative z-10 flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-4 text-center">
            Verification Code
          </label>

          <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                maxLength={1}
                autoFocus={i === 0}
                className={`w-12 h-12 text-center text-xl font-bold text-white rounded-xl outline-none transition border ${
                  digit
                    ? "bg-[rgba(254,131,33,0.1)] border-[rgba(254,131,33,0.5)] shadow-[0_0_12px_rgba(254,131,33,0.2)]"
                    : "bg-[var(--surface)] border-[var(--line)] focus:border-white"
                }`}
              />
            ))}
          </div>
        </div>

        {error && <div className="text-xs font-semibold text-red-500 text-center">{error}</div>}

        <SlantedButton
          type="submit"
          disabled={!otpValid}
          isLoading={verifyOtpMutation.isPending}
          className="w-full"
        >
          Verify
        </SlantedButton>

        <button
          type="button"
          onClick={() => router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)}
          className="w-full py-2 text-xs font-semibold text-[var(--muted)] hover:text-white transition text-center"
        >
          {email ? "← Change email address" : "← Change phone number"}
        </button>
      </form>
    </div>
  );
};
