export interface UserProfile {
  id?: string;
  uid?: string;
  email?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  displayName?: string | null;
  username?: string | null;
  userName?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  isProfileComplete?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken?: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}
