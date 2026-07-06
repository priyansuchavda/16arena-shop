"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { useUserSummary } from "../hooks/useAuth";
import { userApi } from "@/features/user/services/user.service";
import { CheckCircle2, AlertCircle, Loader2, Edit2 } from "lucide-react";

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

export const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: userSummary } = useUserSummary();

  const returnUrl = searchParams.get("returnUrl") || "/shop";

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

  // Input element refs
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth guard
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [_hasHydrated, isAuthenticated, router, returnUrl]);

  // Autofill dynamic profile data
  useEffect(() => {
    const profile = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
    if (profile) {
      if (profile.displayName) setDisplayName(profile.displayName);
      
      // Username
      if (profile.username || profile.userName) {
        const u = profile.username || profile.userName || "";
        setUserName(u);
        setUsernameEditable(!u); // Locked if username is already set
      } else {
        setUsernameEditable(true);
      }

      // Gender
      if (profile.gender) {
        const g = profile.gender;
        setGender(g === "male" || g === "Male" ? "Male" : g === "female" || g === "Female" ? "Female" : "Others");
        setGenderEditable(false); // Locked if gender is already set
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
          setDobEditable(false); // Locked if DOB is already set
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
    val = val.replace(/[^A-Za-z\s]/g, "");
    if (val.length > 20) val = val.slice(0, 20);
    setDisplayName(val);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!usernameEditable) return;
    let val = e.target.value.toLowerCase();
    val = val.replace(/[^a-z0-9._]/g, "");
    if (val.length > 20) val = val.slice(0, 20);
    setUserName(val);
    triggerAvailabilityCheck(val);
  };

  const validateDob = (dd: string, mm: string, yyyy: string): string | null => {
    if (!dobEditable) return null; // Skip if dob not editable
    if (!dd.trim() && !mm.trim() && !yyyy.trim()) return null;
    if (!dd.trim() || !mm.trim() || !yyyy.trim()) return "Please complete your date of birth";

    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return "Enter a valid numeric date";
    if (month < 1 || month > 12) return "Enter a valid month (01–12)";

    const now = new Date();
    const currentYear = now.getFullYear();
    const minYear = currentYear - 120;

    if (year < minYear || year > currentYear) return `Enter a year between ${minYear} and ${currentYear}`;

    const dobDate = new Date(year, month - 1, day);
    if (dobDate > now) return "Date of birth cannot be in the future";

    let age = now.getFullYear() - dobDate.getFullYear();
    const mDiff = now.getMonth() - dobDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 18) return "You must be at least 18 years old";
    return null;
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDobDay(val);
    if (val.length === 2) monthInputRef.current?.focus();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDobMonth(val);
    if (val.length === 2) yearInputRef.current?.focus();
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
      
      if (data) {
        setUser(data);
      } else {
        const currentProfile = userSummary?.userProfile || userSummary || useAuthStore.getState().user;
        setUser({
          ...currentProfile,
          displayName: displayName.trim(),
          image: avatarUrl,
          avatarUrl: avatarUrl,
          ...(usernameEditable && { username: userName.trim(), userName: userName.trim() }),
          ...(dobEditable && dateOfBirth && { dateOfBirth }),
          ...(genderEditable && gender && { gender }),
        });
      }

      router.replace(returnUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--void)]">
        <Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[var(--line)] bg-[#121212]/90 p-8 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #fe8321, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #ff973c, transparent 70%)" }}
      />

      <div className="relative mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-white">Set up your profile</h1>
        <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
          Update your public gaming profile details.
        </p>
      </div>

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
          <label className="flex justify-between text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            <span>
              Display Name <span className="text-red-500">*</span>
            </span>
            <span className={displayName.length >= 20 ? "text-red-500" : ""}>
              {displayName.length}/20
            </span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder="Ninza"
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-white transition"
          />
        </div>

        {/* USERNAME */}
        <div>
          <label className="flex justify-between text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            <span>
              Username <span className="text-red-500">*</span>
            </span>
            {usernameEditable && (
              <span className={userName.length >= 20 ? "text-red-500" : ""}>
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
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm outline-none placeholder:text-[var(--faint)] focus:border-white transition"
            />
          ) : (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--faint)] font-mono select-none">@</span>
              <div className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/50 text-sm font-mono cursor-not-allowed select-none">
                {userName}
              </div>
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
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            <span>
              Date of Birth {!dobEditable && <span className="text-white/20 normal-case">(locked)</span>}
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
                className="w-16 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-white transition"
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
                className="w-16 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-white transition"
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
                className="w-24 px-2 py-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl text-white text-sm text-center outline-none placeholder:text-[var(--faint)] focus:border-white transition"
              />
            </div>
          ) : (
            <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/50 text-sm cursor-not-allowed select-none">
              {dobDay}/{dobMonth}/{dobYear}
            </div>
          )}
        </div>

        {/* GENDER SELECTOR */}
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            <span>
              Gender {!genderEditable && <span className="text-white/20 normal-case">(locked)</span>}
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
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition active:scale-95 ${
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

        {/* CONTINUE BUTTON */}
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${
            !saving
              ? "bg-gradient-to-r from-[#ff973c] via-[#fe8321] to-[#ff6a00] text-[#0c0c0c] hover:brightness-105 shadow-[0_8px_24px_rgba(254,131,33,0.3)]"
              : "bg-white/[0.08] text-white/30 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
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
