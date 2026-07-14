/**
 * True for mobile browsers where signInWithPopup is unreliable (iOS Safari
 * blocks/drops it outside a same-tick user gesture, many Android WebViews
 * don't support window.open popups at all) — Firebase's own guidance is to
 * fall back to signInWithRedirect there.
 */
export function isMobileAuthDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
