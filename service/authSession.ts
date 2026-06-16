import type { BackendAuthUser, AuthUser } from "@/types/auth";
import { useAuthStore } from "@/stores/auth.store";

export const normalizeAuthUser = (user: BackendAuthUser): AuthUser => ({
  id: user.id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone,
  status: user.status,
  roleType: user.roleType,
  role: typeof user.role === "string" ? user.role : user.role?.name || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
 
  showroom: Array.isArray(user.showroom) ? user.showroom : [],
  stores: Array.isArray(user.stores) ? user.stores : [],
  lastLoginAt: user.lastLoginAt,
});

export const setAuthenticatedUser = (
  user: AuthUser,
  tokens?: { accessToken: string; refreshToken: string },
) => {
  const store = useAuthStore.getState();
  if (tokens) {
    store.setAuth(user, tokens);
  } else {
    // Profile refresh — keep existing tokens
    store.setUser(user);
  }
};

export const clearClientAuth = () => {
  useAuthStore.getState().clearAuth();

  // Clean up legacy keys from previous architecture
  if (typeof window !== "undefined") {
    localStorage.removeItem("permission-storage");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

export const buildLoginRedirect = (callbackUrl?: string) => {
  if (!callbackUrl) {
    return "/login";
  }

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

export const redirectToLogin = (callbackUrl?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(buildLoginRedirect(callbackUrl));
};
