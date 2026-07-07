"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useUserSummary } from "../hooks/useAuth";
import { userApi } from "@/features/user/services/user.service";
import { authApi } from "../services/auth.service";
import { CheckCircle2, AlertCircle, Loader2, Edit2, ChevronLeft } from "lucide-react";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

const PRESET_AVATARS = [
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_1-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_2-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_3-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_4-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_5-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_6-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_7-min.jpg",
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_8-min.jpg",
];

export const RegisterForm = ({
  returnUrl: returnUrlProp,
  onClose,
}: {
  returnUrl?: string;
  onClose?: () => void;
} = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, isAuthenticated, _hasHydrated, closeRegisterModal } = useAuthStore();
  const { data: userSummary } = useUserSummary();
  const profile = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
  const isProfileComplete = profile?.isProfileComplete ?? false;

  const returnUrl = returnUrlProp ?? (searchParams.get("returnUrl") || "/shop");

  const leaveRegisterFlow = (url?: string) => {
    closeRegisterModal();
    onClose?.();
    router.replace(url ?? returnUrl);
  };

  // Input states
  const [displayName, setDisplayName] = useState("");
  const [userName, setUserName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);

  // Editability lock states
  const [usernameEditable, setUsernameEditable] = useState(true);
  const [dobEditable, setDobEditable] = useState(true);
  const [genderEditable, setGenderEditable] = useState(true);

  // Modal / sheet state
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);

  // Status & error states
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  // Referral flow states
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState("");

  // Shake states
  const [shakeDisplayNameInput, setShakeDisplayNameInput] = useState(false);
  const [shakeDisplayNameCounter, setShakeDisplayNameCounter] = useState(false);
  const [flashDisplayNameRed, setFlashDisplayNameRed] = useState(false);

  const [shakeUsernameInput, setShakeUsernameInput] = useState(false);
  const [shakeUsernameCounter, setShakeUsernameCounter] = useState(false);
  const [flashUsernameRed, setFlashUsernameRed] = useState(false);

  const [shakeDayInput, setShakeDayInput] = useState(false);
  const [shakeMonthInput, setShakeMonthInput] = useState(false);

  const triggerShake = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    setTimeout(() => setter(false), 400);
  };

  // Input element refs
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus display name input when profile setup is shown
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && !showReferral) {
      const timer = setTimeout(() => {
        displayNameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, isAuthenticated, showReferral]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth guard
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      closeRegisterModal();
      onClose?.();
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [_hasHydrated, isAuthenticated, router, returnUrl, closeRegisterModal, onClose]);

  // Autofill dynamic profile data
  useEffect(() => {
    const profile = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
    if (profile) {
      // Only autofill valid displayNames (letters & spaces only) if profile is already complete
      if (profile.isProfileComplete && profile.displayName && /^[A-Za-z\s]+$/.test(profile.displayName)) {
        setDisplayName(profile.displayName);
      } else {
        setDisplayName("");
      }
      
      // Username
      if (profile.username || profile.userName) {
        const u = profile.username || profile.userName || "";
        const isTempUsername = u.toLowerCase().startsWith("user_");
        // Only autofill username if profile is complete and not a temporary username
        if (profile.isProfileComplete && !isTempUsername) {
          setUserName(u);
        } else {
          setUserName("");
        }
        // Editable if username is temporary or profile is incomplete
        setUsernameEditable(isTempUsername || !profile.isProfileComplete || !u);
      } else {
        setUsernameEditable(true);
      }

      // Gender
      if (profile.gender) {
        const g = profile.gender;
        setGender(g === "male" || g === "Male" ? "Male" : g === "female" || g === "Female" ? "Female" : "Others");
        setGenderEditable(!profile.isProfileComplete || false); // Locked if gender is set & profile complete
      } else {
        setGenderEditable(true);
      }

      if (profile.image || profile.avatarUrl || profile.photoURL) {
        setAvatarUrl(profile.image || profile.avatarUrl || profile.photoURL || PRESET_AVATARS[0]);
      }

      // DOB
      if (profile.dateOfBirth) {
        const date = new Date(profile.dateOfBirth);
        if (!isNaN(date.getTime())) {
          setDobDay(String(date.getUTCDate()).padStart(2, "0"));
          setDobMonth(String(date.getUTCMonth() + 1).padStart(2, "0"));
          setDobYear(String(date.getUTCFullYear()));
          setDobEditable(!profile.isProfileComplete || false); // Locked if DOB is set & profile complete
        } else {
          setDobEditable(true);
        }
      } else {
        setDobEditable(true);
      }
    }
  }, [userSummary]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const validateDisplayName = (val: string): string | null => {
    const text = val.trim();
    if (text === "") return "Display name is required";
    if (text.length < 2 || text.length > 20) return "Display name must be 2–20 characters only";
    if (!/^[A-Za-z\s]+$/.test(text)) return "Only letters and spaces allowed";
    return null;
  };

  const validateUsername = (val: string): string | null => {
    const text = val.trim();
    if (text === "") return "Username is required";
    if (text.length < 3 || text.length > 20) return "Username must be 3–20 characters";
    if (!/^[A-Za-z]/.test(text)) return "Username must start with a letter";
    if (!/^[A-Za-z0-9._]+$/.test(text)) return "Only letters, numbers, dots and underscores allowed";
    return null;
  };

  const triggerAvailabilityCheck = (username: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setError("");

    // If username is already verified/saved for this user, skip check
    const currentProfile = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
    const currentUsername = currentProfile?.username || currentProfile?.userName;
    if (currentUsername && currentUsername.toLowerCase() === username.toLowerCase()) {
      setAvailabilityStatus("available");
      setAvailabilityMessage("This is your current username");
      return;
    }

    if (!username.trim()) {
      setAvailabilityStatus("idle");
      setAvailabilityMessage("");
      return;
    }

    setAvailabilityStatus("checking");
    setAvailabilityMessage("Checking availability...");

    debounceTimerRef.current = setTimeout(async () => {
      const offlineValidationError = validateUsername(username);
      if (offlineValidationError) {
        setAvailabilityStatus("taken");
        setAvailabilityMessage(offlineValidationError);
        return;
      }

      try {
        const response = await userApi.checkUsernameAvailability(username);
        if (response.available) {
          setAvailabilityStatus("available");
          setAvailabilityMessage("Username is available");
        } else {
          setAvailabilityStatus("taken");
          setAvailabilityMessage("That username is already taken.");
        }
      } catch {
        setAvailabilityStatus("idle");
        setAvailabilityMessage("");
      }
    }, 800);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Collapse consecutive spaces
    const collapsedSpaces = val.replace(/\s+/g, " ");
    
    // If length exceeded 20
    if (collapsedSpaces.length > 20) {
      triggerShake(setShakeDisplayNameCounter);
      setFlashDisplayNameRed(true);
      setTimeout(() => setFlashDisplayNameRed(false), 1000);
      return;
    }
    
    // Check for invalid characters
    const hasInvalidChar = /[^A-Za-z\s]/.test(collapsedSpaces);
    
    if (hasInvalidChar) {
      triggerShake(setShakeDisplayNameInput);
      setDisplayName(collapsedSpaces);
      setTimeout(() => {
        setDisplayName((prev) => prev.replace(/[^A-Za-z\s]/g, "").replace(/\s+/g, " "));
      }, 500);
    } else {
      setDisplayName(collapsedSpaces);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!usernameEditable) return;
    let val = e.target.value.toLowerCase();
    
    // Check max length
    if (val.length > 20) {
      triggerShake(setShakeUsernameCounter);
      setFlashUsernameRed(true);
      setTimeout(() => setFlashUsernameRed(false), 1000);
      return;
    }
    
    // Check for invalid characters
    const hasInvalidChar = /[^a-z0-9._]/.test(val);
    
    if (hasInvalidChar) {
      triggerShake(setShakeUsernameInput);
      setUserName(val);
      setTimeout(() => {
        setUserName((prev) => {
          const cleaned = prev.replace(/[^a-z0-9._]/g, "");
          triggerAvailabilityCheck(cleaned);
          return cleaned;
        });
      }, 500);
    } else {
      setUserName(val);
      triggerAvailabilityCheck(val);
    }
  };

  const validateDob = (dd: string, mm: string, yyyy: string): string | null => {
    if (!dobEditable) return null; // Skip if dob not editable
    if (!dd.trim() && !mm.trim() && !yyyy.trim()) return null;
    if (!dd.trim() || !mm.trim() || !yyyy.trim()) {
      return "Please complete your date of birth or clear all fields";
    }

    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return "Enter a valid numeric date";
    if (month < 1 || month > 12) return "Enter a valid month (01–12)";

    const now = new Date();
    const currentYear = now.getFullYear();
    const minYear = currentYear - 120;

    if (year < minYear || year > currentYear) {
      return `Enter a year between ${minYear} and ${currentYear}`;
    }

    // Days-in-month check
    const maxDays = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDays) {
      return "Enter a valid day for this month";
    }

    // Calculated birthdate cannot be in the future
    const dobDate = new Date(Date.UTC(year, month - 1, day));
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (dobDate > todayUtc) {
      return "Date of birth cannot be in the future";
    }

    // Age gate check & upper limit check
    let age = now.getFullYear() - year;
    const mDiff = now.getMonth() - (month - 1);
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < day)) {
      age--;
    }

    if (age > 120) {
      return "Please enter a realistic date of birth";
    }

    if (age < 16) {
      return "You must be at least 16 years old";
    }

    return null;
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    
    if (rawVal.length === 1) {
      setDobDay(rawVal);
    } else if (rawVal.length === 2) {
      const dayNum = parseInt(rawVal, 10);
      if (dayNum >= 1 && dayNum <= 31) {
        setDobDay(rawVal);
        monthInputRef.current?.focus();
      } else {
        triggerShake(setShakeDayInput);
      }
    } else if (rawVal.length === 0) {
      setDobDay("");
    }
  };

  const handleDayBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length === 1) {
      setDobDay("0" + val);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    
    if (rawVal.length === 1) {
      setDobMonth(rawVal);
    } else if (rawVal.length === 2) {
      const firstDigit = rawVal[0];
      const secondDigit = rawVal[1];
      
      if (firstDigit === "1") {
        if (secondDigit === "0" || secondDigit === "1" || secondDigit === "2") {
          setDobMonth(rawVal);
          yearInputRef.current?.focus();
        } else {
          triggerShake(setShakeMonthInput);
        }
      } else if (firstDigit === "0") {
        if (secondDigit >= "1" && secondDigit <= "9") {
          setDobMonth(rawVal);
          yearInputRef.current?.focus();
        } else {
          triggerShake(setShakeMonthInput);
        }
      } else {
        triggerShake(setShakeMonthInput);
      }
    } else if (rawVal.length === 0) {
      setDobMonth("");
    }
  };

  const handleMonthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length === 1) {
      setDobMonth("0" + val);
    }
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && dobMonth === "") dayInputRef.current?.focus();
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && dobYear === "") monthInputRef.current?.focus();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const displayNameError = validateDisplayName(displayName);
    const usernameError = usernameEditable ? validateUsername(userName) : null;
    const dobError = validateDob(dobDay, dobMonth, dobYear);

    if (displayNameError) {
      setError(displayNameError);
      return;
    }
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (usernameEditable && availabilityStatus === "taken") {
      setError("That username is already taken.");
      return;
    }
    if (dobError) {
      setError(dobError);
      return;
    }

    setSaving(true);

    try {
      let dateOfBirth: string | undefined = undefined;
      if (dobEditable && dobDay && dobMonth && dobYear) {
        const d = parseInt(dobDay, 10);
        const m = parseInt(dobMonth, 10);
        const y = parseInt(dobYear, 10);
        dateOfBirth = new Date(Date.UTC(y, m - 1, d)).toISOString();
      }

      const payload: any = {
        displayName: displayName.trim(),
        image: avatarUrl,
        ...(usernameEditable && { username: userName.trim(), userName: userName.trim() }),
        ...(dobEditable && dateOfBirth && { dateOfBirth }),
        ...(genderEditable && gender && { gender }),
      };

      const updated = await userApi.updateProfile(payload);
      const data = updated?.data || updated;
      
      // Get complete status before setting updated user state
      const profileBefore = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
      const wasCompleteBefore = profileBefore?.isProfileComplete ?? false;

      if (data) {
        setUser(data);
      } else {
        setUser({
          ...profileBefore,
          displayName: displayName.trim(),
          image: avatarUrl,
          avatarUrl: avatarUrl,
          ...(usernameEditable && { username: userName.trim(), userName: userName.trim() }),
          ...(dobEditable && dateOfBirth && { dateOfBirth }),
          ...(genderEditable && gender && { gender }),
        });
      }

      if (wasCompleteBefore) {
        leaveRegisterFlow();
      } else {
        setShowReferral(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReferralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setReferralCode(val);
    setReferralError("");
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) return;

    setReferralLoading(true);
    setReferralError("");
    setReferralSuccess("");

    try {
      await authApi.applyReferral(referralCode);
      setReferralSuccess("Referral code applied successfully!");
      localStorage.setItem("referralFlowCompleted", "true");
      setTimeout(() => {
        leaveRegisterFlow();
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid referral code. Please check and try again.";
      setReferralError(msg);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleSkipReferral = () => {
      localStorage.setItem("referralFlowCompleted", "true");
      leaveRegisterFlow();
  };

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />
      </div>
    );
  }

  if (showReferral) {
    return (
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[16px] border border-white/10 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-[21px] font-semibold leading-[20px] tracking-[0px] text-white">
            Referral Bonus
          </h2>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/10 w-full mb-5" />

        {/* Banner area */}
        {referralSuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold text-center animate-in fade-in duration-200">
            {referralSuccess}
          </div>
        )}
        {referralError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold text-center animate-in fade-in duration-200">
            {referralError}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Gift Box Icon with radial backdrop glow */}
          <div className="relative flex items-center justify-center my-4 h-[140px] w-full">
            <div className="absolute w-[200px] h-[100px] bg-gradient-to-r from-[#FF973C]/20 to-[#FE750E]/20 rounded-full blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coin_box.png" alt="Gift Box" className="relative z-10 w-[140px] h-[140px] object-contain" />
          </div>

          <p className="text-sm font-semibold text-white/90">
            Enter Referral Code and Earn
          </p>
          <h2 className="text-xl font-extrabold text-[#FF973C] tracking-wide mt-1">
            10 Arena Coins
          </h2>

          {/* Form */}
          <form onSubmit={handleApplyReferral} className="w-full mt-6 text-left space-y-6">
            <div>
              <label className="block text-xs font-bold text-white/60 tracking-wide mb-2">
                Enter Referral Code <span className="text-[10px] font-normal text-white/40 lowercase">(optional)</span>
              </label>
              <div className="p-[1.5px] bg-gradient-to-r from-[#FF973C] to-[#FE750E] rounded-[10px] overflow-hidden">
                <input
                  type="text"
                  value={referralCode}
                  onChange={handleReferralInputChange}
                  placeholder="EX: 12GHHAHX"
                  style={{ outline: 'none', boxShadow: 'none', border: 'none', borderRadius: '8.5px' }}
                  className="w-full bg-[#121212] text-white px-4 py-3 text-base font-bold tracking-wider outline-none placeholder:text-white/20 text-center uppercase focus:bg-[#161616] transition duration-200"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-4">
              <SlantedButton
                type="submit"
                disabled={!referralCode.trim()}
                isLoading={referralLoading}
                className="w-full"
              >
                Continue
              </SlantedButton>

              <button
                type="button"
                onClick={handleSkipReferral}
                style={{ textDecoration: 'underline' }}
                className="block text-white/60 hover:text-white text-xs font-bold mx-auto py-1 transition duration-200"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[16px] border border-white/10 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-sans text-[21px] font-semibold leading-[20px] tracking-[0px] text-white">
            {isProfileComplete ? "Update profile details" : "Set up your profile"}
          </h2>
        </div>
        
        {isProfileComplete && (
          <button
            type="button"
            onClick={() => leaveRegisterFlow()}
            className="flex items-center justify-center text-white hover:opacity-80 transition duration-200"
            aria-label="Close"
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

      <form onSubmit={handleSaveProfile} noValidate className="relative z-10 flex flex-col gap-4">
        {/* AVATAR SELECTOR */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
            </div>
            <button
              type="button"
              onClick={() => setIsAvatarSheetOpen(true)}
              className="absolute bottom-0 right-0 bg-[var(--flame)] p-1.5 rounded-full cursor-pointer hover:brightness-110 transition shadow-lg flex items-center justify-center w-7 h-7 border border-[#121212]"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#121212]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAvatarSheetOpen(true)}
            className="mt-2 text-xs font-semibold text-[var(--muted)] hover:text-white transition"
          >
            Change Avatar
          </button>
        </div>

        {/* DISPLAY NAME */}
        <div>
          <label className="flex justify-between text-xs font-bold text-white/60 mb-2">
            <span>
              Display Name {!isProfileComplete && <span className="text-red-500">*</span>}
            </span>
            <span className={`transition duration-200 ${shakeDisplayNameCounter ? "animate-shake" : ""} ${flashDisplayNameRed ? "text-red-500 font-bold" : displayName.length >= 20 ? "text-red-500" : ""}`}>
              {displayName.length}/20
            </span>
          </label>
          <input
            ref={displayNameInputRef}
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder="Ninza"
            style={{ outline: 'none', boxShadow: 'none', borderRadius: '10px' }}
            className={`w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px] text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-[#ff7a00] transition duration-200 ${shakeDisplayNameInput ? "animate-shake border-red-500" : ""}`}
          />
        </div>

        {/* USERNAME */}
        <div>
          <label className="flex justify-between text-xs font-bold text-white/60 mb-2">
            <span>
              Username {!isProfileComplete && <span className="text-red-500">*</span>}
            </span>
            {usernameEditable && (
              <span className={`transition duration-200 ${shakeUsernameCounter ? "animate-shake" : ""} ${flashUsernameRed ? "text-red-500 font-bold" : userName.length >= 20 ? "text-red-500" : ""}`}>
                {userName.length}/20
              </span>
            )}
          </label>

          {usernameEditable ? (
            <input
              type="text"
              value={userName}
              onChange={handleUsernameChange}
              placeholder="ninza123"
              style={{ outline: 'none', boxShadow: 'none', borderRadius: '10px' }}
              className={`w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px] text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-[#ff7a00] transition duration-200 ${shakeUsernameInput ? "animate-shake border-red-500" : ""}`}
            />
          ) : (
            <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-[10px] text-white/50 text-sm font-mono cursor-not-allowed select-none">
              {userName}
            </div>
          )}

          {usernameEditable && availabilityStatus !== "idle" && (
            <div
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                availabilityStatus === "checking"
                  ? "text-[var(--muted)]"
                  : availabilityStatus === "available"
                    ? "text-[var(--win)]"
                    : "text-red-500"
              }`}
            >
              {availabilityStatus === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {availabilityStatus === "available" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {availabilityStatus === "taken" && <AlertCircle className="w-3.5 h-3.5" />}
              <span>{availabilityMessage}</span>
            </div>
          )}
        </div>

        {/* DATE OF BIRTH */}
        <div>
          <label className="block text-xs font-bold text-white/60 mb-2">
            <span>
              Date of Birth {!isProfileComplete && <span className="text-[10px] font-normal text-white/40 lowercase">(optional)</span>}
            </span>
          </label>

          {dobEditable ? (
            <div className="flex items-center gap-2">
              <input
                ref={dayInputRef}
                type="text"
                inputMode="numeric"
                placeholder="DD"
                value={dobDay}
                onChange={handleDayChange}
                onBlur={handleDayBlur}
                style={{ outline: 'none', boxShadow: 'none', borderRadius: '10px' }}
                className={`w-16 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px] text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-[#ff7a00] transition duration-200 ${shakeDayInput ? "animate-shake border-red-500" : ""}`}
              />
              <span className="text-[var(--faint)]">/</span>
              <input
                ref={monthInputRef}
                type="text"
                inputMode="numeric"
                placeholder="MM"
                value={dobMonth}
                onChange={handleMonthChange}
                onKeyDown={handleMonthKeyDown}
                onBlur={handleMonthBlur}
                style={{ outline: 'none', boxShadow: 'none', borderRadius: '10px' }}
                className={`w-16 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px] text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-[#ff7a00] transition duration-200 ${shakeMonthInput ? "animate-shake border-red-500" : ""}`}
              />
              <span className="text-[var(--faint)]">/</span>
              <input
                ref={yearInputRef}
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={handleYearKeyDown}
                style={{ outline: 'none', boxShadow: 'none', borderRadius: '10px' }}
                className="w-24 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-[10px] text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-[#ff7a00] transition duration-200"
              />
            </div>
          ) : (
            <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-[10px] text-white/50 text-sm cursor-not-allowed select-none">
              {dobDay}/{dobMonth}/{dobYear}
            </div>
          )}
        </div>

        {/* GENDER SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-white/60 mb-2">
            <span>
              Gender {!isProfileComplete && <span className="text-[10px] font-normal text-white/40 lowercase">(optional)</span>}
            </span>
          </label>
          <div className="flex gap-2">
            {["Male", "Female", "Others"].map((g) => {
              const isSelected = gender === g || (g === "Others" && gender === "Others");
              return (
                <button
                  key={g}
                  type="button"
                  disabled={!genderEditable}
                  onClick={() => genderEditable && setGender(g)}
                  style={{ borderRadius: '10px' }}
                  className={`flex-1 py-2.5 rounded-[10px] border text-sm font-semibold transition active:scale-95 ${
                    isSelected
                      ? "bg-[rgba(254,131,33,0.1)] border-[var(--flame)] text-white shadow-[0_0_12px_rgba(254,131,33,0.15)]"
                      : "bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:bg-white/[0.02]"
                  } ${!genderEditable ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && <div className="text-xs font-semibold text-red-500 text-center my-1">{error}</div>}

        <SlantedButton
          type="submit"
          isLoading={saving}
          className="w-full"
        >
          {isProfileComplete ? "Save Changes" : "Continue"}
        </SlantedButton>
      </form>

      {/* AVATAR SHEET DIALOG */}
      {isAvatarSheetOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-[var(--line)] bg-[#0c0c0c] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative">
            <h3 className="font-heading text-lg font-bold text-white mb-1">Choose Avatar</h3>
            <p className="text-xs text-[var(--muted)] mb-4">Select a preset profile avatar</p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {PRESET_AVATARS.map((url, i) => {
                const isSelected = avatarUrl === url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition-all active:scale-95 ${
                      isSelected
                        ? "border-[var(--flame)] scale-105 ring-1 ring-[var(--flame)]/30"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preset ${i + 1}`} className="object-cover w-full h-full" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--flame)]/20 flex items-center justify-center text-[#0c0c0c] font-extrabold text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsAvatarSheetOpen(false)}
              className="w-full py-3 bg-gradient-to-r from-[#ff973c] to-[#ff6a00] text-[#0c0c0c] rounded-xl text-sm font-bold active:scale-95 transition"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
