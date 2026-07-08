"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { useRequestOtp, useVerifyOtp, useGoogleLogin, useRequestEmailOtp } from "../hooks/useAuth";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

export function AuthCard({
  onSuccess,
  onClose,
  showCloseButton = false,
}: {
  onSuccess: (isProfileComplete: boolean) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");

  const requestOtpMutation = useRequestOtp();
  const requestEmailOtpMutation = useRequestEmailOtp();
  const verifyOtpMutation = useVerifyOtp();
  const googleLoginMutation = useGoogleLogin();

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus input fields on step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === "phone") {
        if (loginMode === "phone") {
          phoneInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      } else if (step === "otp") {
        inputRefs[0].current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [step, loginMode]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    try {
      let response;
      if (loginMode === "phone") {
        if (phone.length < 10) return;
        response = await requestOtpMutation.mutateAsync(phone);
      } else {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValid) {
          setError("Please enter a valid email address.");
          return;
        }
        response = await requestEmailOtpMutation.mutateAsync(email);
      }

      const token =
        response?.otpToken ||
        response?.data?.otpToken ||
        (typeof response === "string" ? response : "");
      
      if (!token) {
        throw new Error("Failed to get OTP token");
      }
      setOtpToken(token);
      setStep("otp");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP.";
      setError(msg);
    }
  };

  const performVerification = async (otpString: string) => {
    if (otpString.length < 4) return;
    setError("");
    try {
      const response = await verifyOtpMutation.mutateAsync({
        otpToken,
        otp: otpString,
      });
      const data = response?.data || response;
      const isComplete = data?.isProfileComplete ?? !!data?.user?.displayName;

      onSuccess(isComplete);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 404) {
        setError("Could not reach the server. Check your API URL.");
      } else {
        setError(msg || "Invalid OTP. Please try again.");
      }
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpString = otp.join("");
    await performVerification(otpString);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const response = await googleLoginMutation.mutateAsync();
      const data = response?.data || response;
      const isComplete = data?.isProfileComplete ?? !!data?.user?.displayName;

      onSuccess(isComplete);
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next field
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    const otpString = newOtp.join("");
    if (otpString.length === 4) {
      performVerification(otpString);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[16px] border border-white/10 bg-[#161616] p-6 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-sans text-[21px] font-semibold leading-[20px] tracking-[0px] text-white">
            {step === "phone" ? "Log in or sign up" : "Enter OTP"}
          </h2>
          {step === "otp" && (
            <p className="mt-2 text-[13px] text-neutral-400 font-medium">
              Code sent to <span className="text-white font-bold">{loginMode === "email" ? email : `+91 ${phone}`}</span>
            </p>
          )}
        </div>
        
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center text-white hover:opacity-80 transition duration-200"
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/10 w-full mb-5" />

      {error && (
        <div className="text-xs font-semibold text-red-500 text-center mb-4">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp}>
          {/* Input Form Area */}
          <div className="flex gap-2.5 mb-5">
            {loginMode === "phone" ? (
              <>
                {/* Country Code Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#252525] px-3 py-3 rounded-[10px] border border-white/5 cursor-pointer hover:bg-[#2d2d2d] transition select-none">
                  <span className="text-[17px]">🇮🇳</span>
                  <span className="text-white text-sm font-semibold tracking-wide">+91</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 ml-0.5 mt-0.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Phone Number Input */}
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  style={{ outline: "none", boxShadow: "none", borderRadius: "10px" }}
                  className="flex-1 bg-[#252525] px-4 py-3 rounded-[10px] border border-white/5 text-white text-sm font-medium placeholder:text-neutral-500 outline-none focus:border-[#ff7a00] focus:bg-[#2a2a2a] transition duration-200"
                />
              </>
            ) : (
              /* Email Input */
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                style={{ outline: "none", boxShadow: "none", borderRadius: "10px" }}
                className="flex-1 bg-[#252525] px-4 py-3 rounded-[10px] border border-white/5 text-white text-sm font-medium placeholder:text-neutral-500 outline-none focus:border-[#ff7a00] focus:bg-[#2a2a2a] transition duration-200"
              />
            )}
          </div>

          <SlantedButton
            type="submit"
            disabled={
              loginMode === "phone"
                ? phone.length < 10
                : !email
            }
            isLoading={requestOtpMutation.isPending || requestEmailOtpMutation.isPending}
            className="w-full h-12"
          >
            <span className="flex items-center gap-2 font-bold text-sm tracking-wide">
              {loginMode === "phone" ? "Continue with Phone" : "Continue with Email"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </SlantedButton>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-[1px] bg-gradient-to-l from-white/20 to-transparent" />
            <span className="px-3.5 text-[11px] font-semibold text-white/40 tracking-wider">OR</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/20 to-transparent" />
          </div>

          {/* Social Logins */}
          <div className="flex gap-3">
            {loginMode === "phone" ? (
              /* Use Email Button */
              <button 
                type="button" 
                onClick={() => {
                  setLoginMode("email");
                  setError("");
                }}
                className="flex-1 flex items-center justify-center bg-[#252525] hover:bg-[#2d2d2d] border border-white/5 h-[52px] rounded-[10px] transition duration-200 text-white text-sm font-bold gap-2"
              >
                <Mail className="w-5 h-5 text-white/80" />
                <span>Use Email</span>
              </button>
            ) : (
              /* Use Phone Button */
              <button 
                type="button" 
                onClick={() => {
                  setLoginMode("phone");
                  setError("");
                }}
                className="flex-1 flex items-center justify-center bg-[#252525] hover:bg-[#2d2d2d] border border-white/5 h-[52px] rounded-[10px] transition duration-200 text-white text-sm font-bold gap-2"
              >
                <Phone className="w-5 h-5 text-white/80" />
                <span>Use Phone</span>
              </button>
            )}

            {/* Google */}
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoginMutation.isPending}
              className="flex-1 flex items-center justify-center bg-[#252525] hover:bg-[#2d2d2d] border border-white/5 h-[52px] rounded-[10px] transition duration-200 disabled:opacity-50 text-white text-sm font-bold gap-2"
            >
              {googleLoginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#ff7a00]" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.3753 12.2523C23.3753 11.317 23.2978 10.6345 23.1302 9.92676H12.2324V14.1481H18.6292C18.5003 15.1972 17.8038 16.777 16.2562 17.8386L16.2345 17.98L19.6802 20.5959L19.9189 20.6193C22.1113 18.6349 23.3753 15.7153 23.3753 12.2523" fill="#4285F4"/>
                    <path d="M12.2323 23.3754C15.3662 23.3754 17.9971 22.3642 19.9188 20.6201L16.2561 17.8394C15.2759 18.5093 13.9604 18.9769 12.2323 18.9769C9.16291 18.9769 6.55778 16.9927 5.62912 14.25L5.493 14.2613L1.91014 16.9787L1.86328 17.1064C3.77198 20.8222 7.69261 23.3754 12.2323 23.3754Z" fill="#34A853"/>
                    <path d="M5.63087 14.2501C5.38583 13.5423 5.24402 12.7839 5.24402 12.0004C5.24402 11.2167 5.38583 10.4584 5.61797 9.75062L5.61148 9.59989L1.98371 6.83887L1.86502 6.8942C1.07835 8.43616 0.626953 10.1677 0.626953 12.0004C0.626953 13.833 1.07835 15.5645 1.86502 17.1064L5.63087 14.2501" fill="#FBBC05"/>
                    <path d="M12.2324 5.0233C14.4119 5.0233 15.8821 5.94594 16.7204 6.71696L19.9962 3.5825C17.9844 1.74987 15.3663 0.625 12.2324 0.625C7.69265 0.625 3.77199 3.17804 1.86328 6.89384L5.61625 9.75027C6.5578 7.00763 9.16295 5.0233 12.2324 5.0233" fill="#EB4335"/>
                  </svg>
                  <span>Google</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          {/* OTP Input Fields */}
          <div className="flex justify-between mb-5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                style={{ outline: "none", boxShadow: "none", borderRadius: "12px" }}
                className="w-[78px] h-[54px] bg-[#2a2a2a] rounded-[12px] border border-white/10 text-white text-center text-[22px] font-bold focus:border-[#ff7a00] focus:bg-[#323232] transition duration-200"
              />
            ))}
          </div>

          <SlantedButton
            type="submit"
            disabled={otp.join("").length < 4}
            isLoading={verifyOtpMutation.isPending}
            className="w-full h-12"
          >
            Verify OTP
          </SlantedButton>

          {/* OTP Footer */}
          <div className="flex items-center justify-between mt-6 text-[13px] font-medium">
            <span className="text-white/40">Didn't receive the code?</span>
            <button 
              type="button"
              onClick={handleRequestOtp}
              disabled={requestOtpMutation.isPending || requestEmailOtpMutation.isPending}
              className="text-[#ff7a00] hover:text-[#ff8c1a] font-bold transition duration-200 disabled:opacity-50"
            >
              Resend
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
