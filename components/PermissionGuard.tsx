// components/PermissionGuard.tsx
// Unified permission guard — replaces PagePermissionGuard + old PermissionGuard + checker.ts
'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface PermissionGuardProps {
  children: ReactNode;
  /** Single permission to check */
  requiredPermission?: string;
  /** Multiple permissions to check */
  requiredPermissions?: string[];
  /** How to evaluate multiple permissions */
  mode?: 'all' | 'any';
  /**
   * What to show when access is denied:
   * - 'deny-page': Full access-denied card (use for page-level guards)
   * - 'hide': Render nothing (use for inline elements like buttons)
   * @default 'deny-page'
   */
  fallback?: 'deny-page' | 'hide';
}

export function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  mode = 'any',
  fallback = 'deny-page',
}: PermissionGuardProps) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hydrated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);

  const isLoading = !hydrated || (hydrated && !user && useAuthStore.getState().isAuthenticated);

  // Still loading — show skeleton for page guards, hide for inline
  if (isLoading) {
    if (fallback === 'hide') return null;
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Verifying permissions…
          </p>
        </div>
      </div>
    );
  }

  // No permission requirements — allow access
  if (!requiredPermission && !requiredPermissions) {
    return <>{children}</>;
  }

  // Check access
  let hasAccess = false;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess =
      mode === 'all'
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied
  if (fallback === 'hide') return null;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      {/* <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <IconShieldLock className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have the required permissions to view this page.
            Contact your administrator if you believe this is an error.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div> */}
    </div>
  );
}

// ── Static helper for non-React contexts (nav filtering, etc.) ──
PermissionGuard.check = (
  requiredPermission?: string,
  requiredPermissions?: string[],
  mode: 'all' | 'any' = 'any'
): boolean => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuthStore.getState();

  if (!requiredPermission && !requiredPermissions) return true;

  if (requiredPermission) {
    return hasPermission(requiredPermission);
  }

  if (requiredPermissions) {
    return mode === 'all'
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  return false;
};
