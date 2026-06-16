"use client";

/**
 * BrandedSplash — single reusable splash / loading screen.
 *
 * Variants:
 *   "loading"  – gold orbit + document icon + pulsing dots  (default)
 *   "success"  – green orbit + checkmark icon + fast bar
 *
 * Usage:
 *   <BrandedSplash />                                      — "Checking authentication"
 *   <BrandedSplash title="Rosewood curtain
" message="Loading…" /> — custom text
 *   <BrandedSplash variant="success" title="Welcome back" message="Preparing your dashboard" />
 */

export type SplashVariant = "loading" | "success";

interface BrandedSplashProps {
  variant?: SplashVariant;
  title?: string;
  message?: string;
}

export default function BrandedSplash({
  variant = "loading",
  title = "Rosewood",
  message = "Checking authentication",
}: BrandedSplashProps) {
  const isSuccess = variant === "success";
  const rootClass = isSuccess
    ? "branded-splash branded-splash--success"
    : "branded-splash";

  return (
    <div className={rootClass}>
      {/* Background glow */}
      <div className="branded-splash__glow" />

      {/* Orbiting rings */}
      <div className="branded-splash__orbits">
        <div className="branded-splash__orbit branded-splash__orbit--1" />
        <div className="branded-splash__orbit branded-splash__orbit--2" />
        <div className="branded-splash__orbit branded-splash__orbit--3" />
      </div>

      {/* Center icon */}
      <div
        className={
          isSuccess
            ? "branded-splash__logo branded-splash__logo--success"
            : "branded-splash__logo"
        }
        style={{ width: 64, height: 64 }}
      >
        {isSuccess ? (
          <svg
            width="64"
            height="64"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16 24l5 5 11-11"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="branded-splash__check"
            />
          </svg>
        ) : (
          <svg
            width="64"
            height="64"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="42" height="42" rx="10" stroke="currentColor" strokeWidth="2" />
            <path d="M14 16h20M14 24h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="branded-splash__content">
        <h2 className="branded-splash__brand">{title}</h2>
        <p className="branded-splash__message">{message}</p>
        <div className="branded-splash__dots">
          <span className="branded-splash__dot" />
          <span className="branded-splash__dot" />
          <span className="branded-splash__dot" />
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="branded-splash__progress">
        <div
          className={
            isSuccess
              ? "branded-splash__bar branded-splash__bar--fast"
              : "branded-splash__bar"
          }
        />
      </div>
    </div>
  );
}
