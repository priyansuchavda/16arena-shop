"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, ChevronDown, ChevronRight } from "lucide-react";
import { useAuthStore, useUserSummary, useLogout } from "@/features/auth";

const DEFAULT_AVATAR_URL =
  "https://metaninzamedia.blob.core.windows.net/media/images/20251218062820_Avatar_2-min.jpg";

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg width="11" height="16" viewBox="0 0 11 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5.33974 0C6.0941 0 6.83152 0.223693 7.45875 0.642792C8.08597 1.06189 8.57484 1.65757 8.86352 2.35451C9.1522 3.05145 9.22773 3.81833 9.08056 4.5582C8.93339 5.29806 8.57013 5.97767 8.03672 6.51108C7.50331 7.04449 6.8237 7.40775 6.08384 7.55492C5.34398 7.70209 4.57709 7.62656 3.88015 7.33788C3.18321 7.04919 2.58753 6.56033 2.16843 5.93311C1.74933 5.30588 1.52564 4.56846 1.52564 3.8141L1.52946 3.64857C1.57211 2.66663 1.99219 1.73906 2.70208 1.0593C3.41197 0.379535 4.35688 5.67863e-05 5.33974 0ZM6.86539 9.15385C7.87695 9.15385 8.84708 9.55569 9.56236 10.271C10.2776 10.9863 10.6795 11.9564 10.6795 12.968V13.7308C10.6795 14.1354 10.5188 14.5234 10.2326 14.8096C9.94652 15.0957 9.55847 15.2564 9.15385 15.2564H1.52564C1.12102 15.2564 0.732963 15.0957 0.44685 14.8096C0.160737 14.5234 0 14.1354 0 13.7308V12.968C0 11.9564 0.401842 10.9863 1.11712 10.271C1.83241 9.55569 2.80254 9.15385 3.8141 9.15385H6.86539Z" fill="currentColor"/>
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3.33398 7.49935C3.33398 7.27834 3.42178 7.06637 3.57806 6.91009C3.73434 6.75381 3.9463 6.66602 4.16732 6.66602H7.50065C7.72166 6.66602 7.93363 6.75381 8.08991 6.91009C8.24619 7.06637 8.33398 7.27834 8.33398 7.49935C8.33398 7.72036 8.24619 7.93232 8.08991 8.0886C7.93363 8.24488 7.72166 8.33268 7.50065 8.33268H4.16732C3.9463 8.33268 3.73434 8.24488 3.57806 8.0886C3.42178 7.93232 3.33398 7.72036 3.33398 7.49935Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.33333 2.5C2.44928 2.5 1.60143 2.85119 0.976311 3.47631C0.35119 4.10143 0 4.94928 0 5.83333L0 14.1667C0 15.0507 0.35119 15.8986 0.976311 16.5237C1.60143 17.1488 2.44928 17.5 3.33333 17.5H16.6667C17.5507 17.5 18.3986 17.1488 19.0237 16.5237C19.6488 15.8986 20 15.0507 20 14.1667V5.83333C20 4.94928 19.6488 4.10143 19.0237 3.47631C18.3986 2.85119 17.5507 2.5 16.6667 2.5H3.33333ZM16.6667 4.16667H3.33333C2.89131 4.16667 2.46738 4.34226 2.15482 4.65482C1.84226 4.96738 1.66667 5.39131 1.66667 5.83333V11.6667H18.3333V5.83333C18.3333 5.39131 18.1577 4.96738 17.8452 4.65482C17.5326 4.34226 17.1087 4.16667 16.6667 4.16667ZM18.3333 13.3333H1.66667V14.1667C1.66667 14.6087 1.84226 15.0326 2.15482 15.3452C2.46738 15.6577 2.89131 15.8333 3.33333 15.8333H16.6667C17.1087 15.8333 17.5326 15.6577 17.8452 15.3452C18.1577 15.0326 18.3333 14.6087 18.3333 14.1667V13.3333Z" fill="currentColor"/>
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M7 13.5C6.49719 13.5001 6.01279 13.3108 5.64327 12.9698C5.27375 12.6289 5.04622 12.1612 5.006 11.66C3.67219 11.1879 2.54805 10.2597 1.83202 9.03936C1.116 7.81901 0.854122 6.38493 1.09263 4.99027C1.33113 3.59561 2.05467 2.33005 3.13554 1.41698C4.21641 0.503917 5.5851 0.00206045 7 6.3094e-08C8.50489 -0.000218052 9.95492 0.565087 11.0626 1.58383C12.1702 2.60256 12.8546 4.00034 12.98 5.5C12.9842 5.56505 12.9748 5.63026 12.9524 5.69148C12.93 5.7527 12.8952 5.8086 12.85 5.85562C12.8049 5.90264 12.7504 5.93976 12.6902 5.96461C12.6299 5.98947 12.5652 6.00152 12.5 6C12.3661 5.99664 12.2381 5.94361 12.1411 5.8512C12.0441 5.7588 11.9849 5.63362 11.975 5.5C11.8859 4.61584 11.5628 3.77138 11.039 3.05357C10.5151 2.33576 9.80942 1.77054 8.99453 1.41609C8.17964 1.06163 7.28501 0.930763 6.40274 1.03694C5.52046 1.14313 4.68243 1.48252 3.97491 2.0202C3.26739 2.55787 2.71594 3.2744 2.37735 4.096C2.03876 4.9176 1.92525 5.8146 2.04851 6.69465C2.17177 7.5747 2.52734 8.406 3.07863 9.10297C3.62991 9.79994 4.35699 10.3374 5.185 10.66C5.33566 10.3345 5.57111 10.0554 5.86667 9.85213C6.16224 9.64885 6.50703 9.5288 6.86493 9.50457C7.22283 9.48033 7.58067 9.55281 7.90094 9.71439C8.2212 9.87597 8.49212 10.1207 8.68529 10.423C8.87846 10.7253 8.98679 11.0739 8.99891 11.4324C9.01103 11.7909 8.9265 12.1461 8.75418 12.4607C8.58186 12.7754 8.32809 13.0379 8.01947 13.2207C7.71084 13.4035 7.35872 13.5 7 13.5ZM2.009 11H2.1C2.49 11.381 2.923 11.717 3.392 12H2.009C1.448 12 1 12.447 1 13C1 14.309 1.622 15.284 2.673 15.953C3.743 16.636 5.265 17 7 17C8.735 17 10.257 16.636 11.327 15.953C12.377 15.283 13 14.31 13 13C13 12.7348 12.8946 12.4804 12.7071 12.2929C12.5196 12.1054 12.2652 12 12 12H9.959C10.0149 11.669 10.0149 11.331 9.959 11H12C12.5304 11 13.0391 11.2107 13.4142 11.5858C13.7893 11.9609 14 12.4696 14 13C14 14.691 13.167 15.966 11.865 16.797C10.583 17.614 8.855 18 7 18C5.145 18 3.417 17.614 2.135 16.797C0.833 15.967 0 14.69 0 13C0 11.887 0.903 11 2.009 11ZM11 6C11.0002 6.67664 10.8288 7.34227 10.5017 7.93463C10.1747 8.52698 9.70273 9.02669 9.13 9.387C8.86304 9.11781 8.54747 8.90166 8.2 8.75C8.83168 8.47431 9.34917 7.98953 9.66546 7.37716C9.98174 6.7648 10.0775 6.06221 9.93672 5.38753C9.7959 4.71284 9.42708 4.10722 8.89225 3.6725C8.35742 3.23777 7.68922 3.00045 7 3.00045C6.31078 3.00045 5.64258 3.23777 5.10775 3.6725C4.57293 4.10722 4.2041 4.71284 4.06328 5.38753C3.92247 6.06221 4.01826 6.7648 4.33454 7.37716C4.65083 7.98953 5.16832 8.47431 5.8 8.75C5.45 8.903 5.135 9.12 4.87 9.387C4.11042 8.90932 3.53351 8.19012 3.232 7.345C3.07818 6.91327 2.99971 6.45831 3 6C3 4.93913 3.42143 3.92172 4.17157 3.17157C4.92172 2.42143 5.93913 2 7 2C8.06087 2 9.07828 2.42143 9.82843 3.17157C10.5786 3.92172 11 4.93913 11 6Z" fill="currentColor"/>
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M0 5C0 3.67392 0.526784 2.40215 1.46447 1.46447C2.40215 0.526784 3.67392 0 5 0H10C10.2652 0 10.5196 0.105357 10.7071 0.292893C10.8946 0.48043 11 0.734784 11 1C11 1.26522 10.8946 1.51957 10.7071 1.70711C10.5196 1.89464 10.2652 2 10 2H5C4.20435 2 3.44129 2.31607 2.87868 2.87868C2.31607 3.44129 2 4.20435 2 5V15C2 15.7956 2.31607 16.5587 2.87868 17.1213C3.44129 17.6839 4.20435 18 5 18H10C10.2652 18 10.5196 18.1054 10.7071 18.2929C10.8946 18.4804 11 18.7348 11 19C11 19.2652 10.8946 19.5196 10.7071 19.7071C10.5196 19.8946 10.2652 20 10 20H5C3.67392 20 2.40215 19.4732 1.46447 18.5355C0.526784 17.5979 0 16.3261 0 15V5Z" fill="#FF4242"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.47 5.31653C11.5598 5.22063 11.6676 5.14335 11.7873 5.08913C11.907 5.03491 12.0362 5.0048 12.1675 5.00053C12.2988 4.99626 12.4297 5.0179 12.5526 5.06423C12.6755 5.11056 12.7882 5.18066 12.884 5.27053L17.684 9.77053C17.7839 9.86407 17.8636 9.97713 17.918 10.1027C17.9725 10.2283 18.0006 10.3637 18.0006 10.5005C18.0006 10.6374 17.9725 10.7728 17.918 10.8984C17.8636 11.0239 17.7839 11.137 17.684 11.2305L12.884 15.7305C12.7881 15.8204 12.6755 15.8904 12.5526 15.9367C12.4296 15.983 12.2988 16.0047 12.1675 16.0004C12.0362 15.9961 11.907 15.966 11.7873 15.9118C11.6677 15.8576 11.5598 15.7804 11.47 15.6845C11.3802 15.5887 11.3101 15.4761 11.2638 15.3531C11.2175 15.2302 11.1959 15.0993 11.2002 14.968C11.2044 14.8367 11.2345 14.7075 11.2887 14.5879C11.3429 14.4682 11.4201 14.3604 11.516 14.2705L14.471 11.5005H5C4.73478 11.5005 4.48043 11.3952 4.29289 11.2076C4.10536 11.0201 4 10.7658 4 10.5005C4 10.2353 4.10536 9.98096 4.29289 9.79343C4.48043 9.60589 4.73478 9.50053 5 9.50053H14.471L11.516 6.73053C11.4201 6.64074 11.3428 6.53292 11.2886 6.41324C11.2344 6.29357 11.2043 6.16438 11.2 6.03307C11.1957 5.90175 11.2174 5.77088 11.2637 5.64793C11.31 5.52499 11.3801 5.41238 11.47 5.31653Z" fill="#FF4242"/>
    </svg>
  );
}

/** Circular avatar — simple borderless profile photo. */
export function ProfileAvatar({ src = DEFAULT_AVATAR_URL }: { src?: string }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
      <Image src={src || DEFAULT_AVATAR_URL} alt="" fill className="object-cover" sizes="32px" priority />
    </span>
  );
}

/** Profile/Login pill badge. Matches SWAG top-bar style. */
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

  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);

  const handleEditProfile = () => {
    setIsOpen(false);
    openRegisterModal("/");
  };

  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="shop-pill group inline-flex h-[42px] shrink-0 items-center border border-white/10 bg-white/[0.03] py-0 pl-1 pr-4 transition hover:brightness-110 animate-fade-in"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FE8321] text-white">
          <LoginIcon className="w-[11px] h-[16px]" />
        </span>
        <span className="ml-2.5 max-w-[8rem] truncate text-[14px] font-semibold leading-none text-white">
          Login
        </span>
      </button>
    );
  }

  const displayName = userSummary?.displayName || user?.displayName || user?.username || "Player";
  const avatarUrl = userSummary?.avatarUrl || user?.avatarUrl || user?.photoURL || DEFAULT_AVATAR_URL;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="shop-pill group inline-flex h-[42px] shrink-0 items-center border border-white/10 bg-white/[0.03] py-0 pl-1 pr-3.5 transition hover:brightness-110 focus:outline-none"
      >
        <ProfileAvatar src={avatarUrl} />
        <span className="ml-2.5 max-w-[8rem] truncate text-[14px] font-semibold leading-none text-white">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-white/50 ml-1.5 transition-transform group-hover:text-white hidden sm:inline" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[280px] overflow-hidden rounded-[20px] border border-white/10 bg-[#2C2C2C] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <User className="w-5 h-5 text-white/90" />
                <span className="text-[15px] font-medium text-white/95">Edit Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </button>
            <div className="border-b border-white/5" />

            <Link
              href="/gift-cards"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition text-left"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3.5">
                <CardIcon className="w-5 h-5 text-white/90" />
                <span className="text-[15px] font-medium text-white/95">My gift cards</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </Link>
            <div className="border-b border-white/5" />

            <a
              href="https://www.16arena.com/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition text-left"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3.5">
                <ContactIcon className="w-5 h-5 text-white/90" />
                <span className="text-[15px] font-medium text-white/95">Contact Us</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </a>
            <div className="border-b border-white/5" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition text-left"
            >
              <div className="flex items-center gap-3.5">
                <LogoutIcon className="w-5 h-5" />
                <span className="text-[15px] font-medium text-white/95">Log out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
