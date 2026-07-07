import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * Persist a freshly issued access token in memory so axios attaches Authorization
 * before any follow-up authenticated requests run.
 */
export function applyAccessToken(accessToken: string | null | undefined): void {
  if (!accessToken) return;
  useAuthStore.getState().setAccessToken(accessToken);
}
