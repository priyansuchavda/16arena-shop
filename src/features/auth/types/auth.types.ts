export interface UserProfile {
  id?: string;
  uid?: string;
  userId?: string;
  email?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  displayName?: string | null;
  username?: string | null;
  userName?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  isProfileComplete?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _sessionInitialized: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isRegisterModalOpen: boolean;
  registerReturnUrl: string;
  registerMessage?: string;
  openRegisterModal: (returnUrl?: string, message?: string) => void;
  closeRegisterModal: () => void;
  setAuth: (user: UserProfile, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  setSessionInitialized: (initialized: boolean) => void;
}
