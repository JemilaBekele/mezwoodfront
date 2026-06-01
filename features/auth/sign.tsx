"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { login } from "@/service/authApi";
import { clearClientAuth } from "@/service/authSession";
import { useAuthStore } from "@/stores/auth.store";
import BrandedSplash from "@/components/BrandedSplash";

/* ─── Ambient Particle Component ────────────────────────────── */
function AmbientParticle({ delay, size, x }: { delay: number; size: number; x: number }) {
  return (
    <div
      className="login-particle"
      style={{
        left: `${x}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ─── Animated Counter ──────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="login-stat">
      <span className="login-stat__value">
        {value}
        {suffix && <span className="login-stat__suffix">{suffix}</span>}
      </span>
      <span className="login-stat__label">{label}</span>
    </div>
  );
}


/* ─── Main Login Page ──────────────────────────────────────── */
export default function SignInViewPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { _hydrated: hydrated, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const clearAuthClientState = useCallback(() => {
    try {
      clearClientAuth();
    } catch (err) {
      console.warn("Error clearing auth client state:", err);
    }
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, hydrated, isAuthenticated, router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    clearAuthClientState();
    setLoading(true);

    try {
      // login() stores user + tokens in the unified store
      // The useEffect above will handle redirect when isAuthenticated becomes true
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 8,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
      })),
    [],
  );

  /* ─── Loading / Guard States ──────────────────────────────── */
  if (!hydrated) {
    return <BrandedSplash message="Verifying your session" />;
  }

  if (isAuthenticated) {
    return (
      <BrandedSplash
        variant="success"
        title="Welcome back"
        message="Preparing your dashboard"
      />
    );
  }

  /* ─── Render ───────────────────────────────────────────────── */
  return (
    <div className="login-root">
      {/* Ambient particles */}
      <div className="login-particles" aria-hidden="true">
        {particles.map((p) => (
          <AmbientParticle key={p.id} delay={p.delay} size={p.size} x={p.x} />
        ))}
      </div>

      {/* ── Hero Panel ─────────────────────────── */}
      <div className="login-hero">
        <div className="login-hero__bg">
<img
  src="/construction-hero.png"
  alt="Construction Management"
  className="login-hero__img"
  loading="eager"
/>          <div className="login-hero__overlay" />
          <div className="login-hero__vignette" />
        </div>

        <div
          className="login-hero__content"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s",
          }}
        >
         <div className="login-brand">
  <div className="login-brand__icon">
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 56H56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 56V28L32 14L48 28V56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 56V40H40V56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M28 24H36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  </div>

<div>
  <h2 className="login-brand__name">ikiz Curtain</h2>
  <p className="login-brand__tagline">
    Curtain Management System
  </p>
</div>
</div>

{/* Quote */}
<div className="login-hero__quote">
  <blockquote>
    &ldquo;Manage curtain orders, fabrics, measurements, installations,
    and customer projects with elegance and efficiency.&rdquo;
  </blockquote>
</div>

    
          <div className="login-hero__stats">
            {/* <AnimatedStat value="12K" label="Vehicles Tracked" suffix="+" /> */}
            <div className="login-hero__stats-divider" />
            {/* <AnimatedStat value="98" label="Uptime" suffix="%" /> */}
            <div className="login-hero__stats-divider" />
            {/* <AnimatedStat value="4.9" label="User Rating" suffix="★" /> */}
          </div>
        </div>
      </div>

      {/* ── Form Panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div
          className="login-card"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(32px) scale(0.96)",
            transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s",
          }}
        >
          <div className="login-card__header">
            <h1 className="login-card__title">Welcome Back</h1>
            <p className="login-card__subtitle">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSignIn} className="login-form">
            {/* Email */}
            <div className={`login-field ${emailFocused || email ? "login-field--active" : ""}`}>
              <label htmlFor="login-email" className="login-field__label">Email Address</label>
              <div className="login-field__input-wrap">
                <div className="login-field__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="login-email" type="email" placeholder="name@company.com"
                  autoCapitalize="none" autoComplete="email" autoCorrect="off"
                  disabled={loading} value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="login-field__input"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`login-field ${passwordFocused || password ? "login-field--active" : ""}`}>
              <label htmlFor="login-password" className="login-field__label">Password</label>
              <div className="login-field__input-wrap">
                <div className="login-field__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="login-password" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" autoComplete="current-password"
                  disabled={loading} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="login-field__input"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="login-field__toggle" tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="login-extras">
              <label className="login-checkbox" htmlFor="login-remember">
                <input type="checkbox" id="login-remember" />
                <span className="login-checkbox__mark" />
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-submit" id="login-submit-btn">
              {loading ? (
                <>
                  <svg className="login-submit__spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing In…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-submit__arrow">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-card__footer">
            <div className="login-secure-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </div>

        <p className="login-copyright">
          © {new Date().getFullYear()} ikiz curtain Management. All rights reserved.
        </p>
      </div>

      {/* ═══ THEME-AWARE  LOGIN PAGE STYLES ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Theme Tokens ─────────────────────────── */
       :root {
  --login-bg: #f8f5ef;
  --login-panel-bg: linear-gradient(145deg, #f6f1e7 0%, #f8f5ef 50%, #efe7d7 100%);
  --login-card-bg: linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,248,235,0.85) 100%);
  --login-card-border: rgba(180, 140, 60, 0.18);

  --login-card-shadow:
    0 0 0 1px rgba(212,175,55,0.08),
    0 20px 60px rgba(0,0,0,0.08),
    0 0 80px rgba(212,175,55,0.06);

  --login-title: #2d2416;
  --login-subtitle: rgba(60, 45, 20, 0.55);
  --login-label: rgba(60, 45, 20, 0.7);

  --login-accent: #d4af37;

  --login-input-bg: rgba(212,175,55,0.05);
  --login-input-border: rgba(180,140,60,0.18);

  --login-input-text: #2d2416;
  --login-input-placeholder: rgba(60,45,20,0.35);

  --login-input-focus-bg: rgba(212,175,55,0.08);
  --login-input-focus-border: rgba(212,175,55,0.55);
  --login-input-focus-ring: rgba(212,175,55,0.12);
  --login-input-focus-glow: rgba(212,175,55,0.12);

  --login-icon: rgba(90,70,30,0.45);
  --login-icon-active: #d4af37;

  --login-toggle: rgba(90,70,30,0.4);
  --login-toggle-hover: #d4af37;

  --login-checkbox-text: rgba(60,45,20,0.55);
  --login-checkbox-border: rgba(180,140,60,0.28);
  --login-checkbox-check-bg: #ffffff;

  --login-forgot: #b8891f;

  --login-btn-bg: linear-gradient(135deg, #f4d06f 0%, #c89b2c 100%);
  --login-btn-text: #2d2416;

  --login-btn-hover-shadow:
    0 8px 24px rgba(212,175,55,0.35),
    0 0 60px rgba(212,175,55,0.15);

  --login-btn-disabled-bg: rgba(0,0,0,0.06);
  --login-btn-disabled-text: rgba(0,0,0,0.3);

  --login-error-bg: rgba(239,68,68,0.06);
  --login-error-border: rgba(239,68,68,0.15);
  --login-error-text: #dc2626;

  --login-secure: rgba(60,45,20,0.45);
  --login-secure-icon: #d4af37;

  --login-copyright: rgba(60,45,20,0.35);

  --login-particle: rgba(212,175,55,0.55);

  --login-hero-overlay-a: rgba(28,22,12,0.72);
  --login-hero-overlay-b: rgba(28,22,12,0.48);
  --login-hero-overlay-c: rgba(28,22,12,0.28);

  --login-hero-vignette-radial: rgba(212,175,55,0.12);
  --login-hero-vignette-edge: rgba(28,22,12,0.82);

  --login-brand-icon: #d4af37;
  --login-brand-name: #f8f5ef;
  --login-brand-tagline: rgba(255,248,235,0.72);

  --login-quote: rgba(255,248,235,0.92);
  --login-quote-border: rgba(212,175,55,0.65);

  --login-stat-value: #f4d06f;
  --login-stat-label: rgba(255,248,235,0.6);
  --login-stat-divider: rgba(255,248,235,0.12);
  --login-stats-border: rgba(255,248,235,0.08);

  --login-mobile-brand: #c89b2c;
}

.dark {
  --login-bg: #0f0b05;

  --login-panel-bg:
    linear-gradient(145deg, #0f0b05 0%, #151008 50%, #1d160b 100%);

  --login-card-bg:
    linear-gradient(160deg,
      rgba(255,255,255,0.06) 0%,
      rgba(212,175,55,0.04) 100%);

  --login-card-border: rgba(212,175,55,0.15);

  --login-card-shadow:
    0 0 0 1px rgba(212,175,55,0.08),
    0 20px 60px rgba(0,0,0,0.6),
    0 0 80px rgba(212,175,55,0.08);

  --login-title: #fff8e7;
  --login-subtitle: rgba(255,248,231,0.55);
  --login-label: rgba(255,248,231,0.7);

  --login-accent: #d4af37;

  --login-input-bg: rgba(255,255,255,0.03);
  --login-input-border: rgba(212,175,55,0.12);

  --login-input-text: #ffffff;
  --login-input-placeholder: rgba(255,255,255,0.22);

  --login-input-focus-bg: rgba(212,175,55,0.05);
  --login-input-focus-border: rgba(212,175,55,0.4);
  --login-input-focus-ring: rgba(212,175,55,0.08);
  --login-input-focus-glow: rgba(212,175,55,0.08);

  --login-icon: rgba(255,248,231,0.3);
  --login-icon-active: #f4d06f;

  --login-toggle: rgba(255,255,255,0.35);
  --login-toggle-hover: #f4d06f;

  --login-checkbox-text: rgba(255,248,231,0.55);
  --login-checkbox-border: rgba(212,175,55,0.22);
  --login-checkbox-check-bg: #0f0b05;

  --login-forgot: #f4d06f;

  --login-btn-bg:
    linear-gradient(135deg, #f4d06f 0%, #b8891f 100%);

  --login-btn-text: #1a1408;

  --login-btn-hover-shadow:
    0 8px 24px rgba(212,175,55,0.3),
    0 0 60px rgba(212,175,55,0.15);

  --login-btn-disabled-bg: rgba(255,255,255,0.08);
  --login-btn-disabled-text: rgba(255,255,255,0.35);

  --login-error-bg: rgba(239,68,68,0.08);
  --login-error-border: rgba(239,68,68,0.2);
  --login-error-text: #f87171;

  --login-secure: rgba(255,248,231,0.4);
  --login-secure-icon: #f4d06f;

  --login-copyright: rgba(255,248,231,0.28);

  --login-particle: rgba(212,175,55,0.65);

  --login-hero-overlay-a: rgba(0,0,0,0.72);
  --login-hero-overlay-b: rgba(15,11,5,0.58);
  --login-hero-overlay-c: rgba(15,11,5,0.35);

  --login-hero-vignette-radial: rgba(212,175,55,0.1);
  --login-hero-vignette-edge: rgba(0,0,0,0.88);

  --login-brand-icon: #f4d06f;
  --login-brand-name: #fff8e7;
  --login-brand-tagline: rgba(255,248,231,0.68);

  --login-quote: rgba(255,248,231,0.92);
  --login-quote-border: rgba(212,175,55,0.55);

  --login-stat-value: #f4d06f;
  --login-stat-label: rgba(255,248,231,0.55);
  --login-stat-divider: rgba(255,248,231,0.12);
  --login-stats-border: rgba(255,248,231,0.08);

  --login-mobile-brand: #f4d06f;
}
        .login-root {
          display: flex;
          min-height: 100vh;
          background: var(--login-bg);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ── Particles ── */
        .login-particles { position: fixed; inset: 0; pointer-events: none; z-index: 1; }

        .login-particle {
          position: absolute; bottom: -10px; border-radius: 50%;
          background: radial-gradient(circle, var(--login-particle) 0%, transparent 70%);
          animation: loginParticleFloat 12s ease-in-out infinite;
        }

        @keyframes loginParticleFloat {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          10%  { opacity: 1; transform: scale(1); }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }

        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* ── Hero ── */
        .login-hero { display: none; position: relative; width: 55%; overflow: hidden; }
        @media (min-width: 1024px) { .login-hero { display: flex; } }

        .login-hero__bg { position: absolute; inset: 0; }
        .login-hero__img { width: 100%; height: 100%; object-fit: cover; object-position: center; }

        .login-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--login-hero-overlay-a) 0%, var(--login-hero-overlay-b) 40%, var(--login-hero-overlay-c) 100%);
        }

        .login-hero__vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, var(--login-hero-vignette-radial) 0%, transparent 60%),
            linear-gradient(to right, var(--login-hero-vignette-edge) 0%, transparent 30%);
        }

        .login-hero__content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px; height: 100%;
        }

        .login-brand { display: flex; align-items: center; gap: 14px; }
        .login-brand__icon { width: 44px; height: 44px; color: var(--login-brand-icon); flex-shrink: 0; }
        .login-brand__icon svg { width: 100%; height: 100%; }
        .login-brand__name { font-size: 22px; font-weight: 600; color: var(--login-brand-name); letter-spacing: 0.5px; margin: 0; }
        .login-brand__tagline { font-size: 13px; color: var(--login-brand-tagline); margin: 2px 0 0; letter-spacing: 0.3px; }

        .login-hero__quote { max-width: 520px; }
        .login-hero__quote blockquote {
          font-size: 24px; font-weight: 300; color: var(--login-quote);
          line-height: 1.5; letter-spacing: 0.2px; margin: 0;
          border-left: 3px solid var(--login-quote-border); padding-left: 20px;
        }

        .login-hero__stats {
          display: flex; align-items: center; gap: 32px;
          padding: 24px 0; border-top: 1px solid var(--login-stats-border);
        }
        .login-hero__stats-divider { width: 1px; height: 40px; background: var(--login-stat-divider); }

        .login-stat { display: flex; flex-direction: column; gap: 4px; }
        .login-stat__value { font-size: 28px; font-weight: 700; color: var(--login-stat-value); letter-spacing: -0.5px; }
        .login-stat__suffix { font-size: 18px; font-weight: 500; margin-left: 2px; }
        .login-stat__label { font-size: 12px; color: var(--login-stat-label); text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }

        /* ── Form Panel ── */
        .login-form-panel {
          position: relative; z-index: 2; flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 24px; background: var(--login-panel-bg);
        }
        @media (min-width: 1024px) { .login-form-panel { width: 45%; flex: none; } }

        /* ── Card ── */
        .login-card {
          width: 100%; max-width: 440px;
          background: var(--login-card-bg);
          border: 1px solid var(--login-card-border);
          border-radius: 24px; padding: 40px;
          backdrop-filter: blur(24px);
          box-shadow: var(--login-card-shadow);
        }

        .login-card__header { text-align: center; margin-bottom: 32px; }
        .login-card__title { font-size: 28px; font-weight: 600; color: var(--login-title); margin: 0 0 8px; letter-spacing: -0.3px; }
        .login-card__subtitle { font-size: 14px; color: var(--login-subtitle); margin: 0; line-height: 1.5; }

        .login-form { display: flex; flex-direction: column; gap: 20px; }

        /* ── Field ── */
        .login-field { display: flex; flex-direction: column; gap: 8px; }
        .login-field__label { font-size: 13px; font-weight: 500; color: var(--login-label); letter-spacing: 0.3px; transition: color 0.3s ease; }
        .login-field--active .login-field__label { color: var(--login-accent); }

        .login-field__input-wrap {
          display: flex; align-items: center;
          background: var(--login-input-bg);
          border: 1px solid var(--login-input-border);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          overflow: hidden;
        }

        .login-field--active .login-field__input-wrap,
        .login-field__input-wrap:focus-within {
          border-color: var(--login-input-focus-border);
          background: var(--login-input-focus-bg);
          box-shadow: 0 0 0 3px var(--login-input-focus-ring), 0 0 20px var(--login-input-focus-glow);
        }

        .login-field__icon { display: flex; align-items: center; justify-content: center; padding-left: 14px; color: var(--login-icon); flex-shrink: 0; transition: color 0.3s ease; }
        .login-field--active .login-field__icon { color: var(--login-icon-active); }

        .login-field__input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 14px; font-size: 15px; color: var(--login-input-text);
          font-family: 'Inter', sans-serif; letter-spacing: 0.2px;
        }
        .login-field__input::placeholder { color: var(--login-input-placeholder); }
        .login-field__input:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-field__toggle {
          display: flex; align-items: center; justify-content: center;
          padding: 0 14px; background: none; border: none;
          color: var(--login-toggle); cursor: pointer; transition: color 0.2s ease;
        }
        .login-field__toggle:hover { color: var(--login-toggle-hover); }

        /* ── Extras ── */
        .login-extras { display: flex; align-items: center; justify-content: space-between; }
        .login-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--login-checkbox-text); user-select: none; }
        .login-checkbox input { display: none; }
        .login-checkbox__mark {
          width: 16px; height: 16px;
          border: 1.5px solid var(--login-checkbox-border);
          border-radius: 4px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease; position: relative;
        }
        .login-checkbox input:checked + .login-checkbox__mark { background: var(--login-accent); border-color: var(--login-accent); }
        .login-checkbox input:checked + .login-checkbox__mark::after {
          content: ''; display: block; width: 4px; height: 8px;
          border: solid var(--login-checkbox-check-bg); border-width: 0 2px 2px 0;
          transform: rotate(45deg); margin-bottom: 2px;
        }
        .login-checkbox__text { line-height: 1; }

        .login-forgot { font-size: 13px; color: var(--login-forgot); text-decoration: none; font-weight: 500; transition: all 0.2s ease; opacity: 0.8; }
        .login-forgot:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }

        /* ── Error ── */
        .login-error {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          background: var(--login-error-bg); border: 1px solid var(--login-error-border);
          border-radius: 12px; color: var(--login-error-text);
          font-size: 13px; font-weight: 500; animation: loginShake 0.4s ease;
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ── Submit ── */
        .login-submit {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 15px 24px; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          background: var(--login-btn-bg); color: var(--login-btn-text);
          letter-spacing: 0.3px; position: relative; overflow: hidden;
        }
        .login-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.35s ease;
        }
        .login-submit:hover:not(:disabled)::before { opacity: 1; }
        .login-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--login-btn-hover-shadow); }
        .login-submit:active:not(:disabled) { transform: translateY(0); }
        .login-submit:disabled { background: var(--login-btn-disabled-bg); color: var(--login-btn-disabled-text); cursor: not-allowed; }

        .login-submit__spinner { width: 20px; height: 20px; animation: loginSpin 0.7s linear infinite; }
        .login-submit__arrow { transition: transform 0.3s ease; }
        .login-submit:hover:not(:disabled) .login-submit__arrow { transform: translateX(4px); }

        /* ── Footer ── */
        .login-card__footer { margin-top: 28px; display: flex; justify-content: center; }
        .login-secure-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--login-secure); letter-spacing: 0.3px; }
        .login-secure-badge svg { color: var(--login-secure-icon); }
        .login-copyright { margin-top: 32px; font-size: 12px; color: var(--login-copyright); text-align: center; }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .login-card { padding: 28px 24px; border-radius: 20px; }
          .login-card__title { font-size: 24px; }
          .login-hero__quote blockquote { font-size: 20px; }
        }
        @media (max-width: 1023px) {
          .login-form-panel::before {
            content: 'ikiz curtain'; display: block; position: absolute; top: 32px; left: 50%;
            transform: translateX(-50%); font-size: 20px; font-weight: 600;
            color: var(--login-mobile-brand); letter-spacing: 0.5px; font-family: 'Inter', sans-serif;
          }
        }
      `}</style>
    </div>
  );
}
