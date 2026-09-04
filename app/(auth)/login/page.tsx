"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Mail,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Building2,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialTab);
  
  // Login form state
  const [email, setEmail] = useState("");
  
  // Register form state
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");

  // OTP Verification state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  // Ensure login/register page strictly renders in light theme mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Sync mode whenever URL search param ?tab= changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setMode("register");
    } else {
      setMode("login");
    }
  }, [searchParams]);

  // If user already has an active valid session, redirect immediately to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/client/dashboard");
      }
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Handle tab switch
  const switchTab = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setOtpSent(false);
    setOtp("");
  };

  // 1. Request OTP for existing account
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, purpose: "LOGIN" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to send verification code");
      }

      setTargetEmail(cleanEmail);
      setOtpSent(true);
      setSuccessMessage(`A 6-digit one-time passcode has been sent to ${cleanEmail}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Self-service Open Workspace Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = registerEmail.trim();
    const cleanFullName = fullName.trim();
    const cleanCompanyName = companyName.trim();

    if (!cleanFullName || !cleanCompanyName || !cleanEmail) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cleanFullName,
          companyName: cleanCompanyName,
          email: cleanEmail,
          mobile: mobile.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create workspace");
      }

      setTargetEmail(cleanEmail);
      setOtpSent(true);
      setSuccessMessage(
        json.data?.message ||
          `Workspace created! A 6-digit verification code has been sent to ${cleanEmail}`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP & Log In directly to dashboard
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, otp: otp.trim(), purpose: "LOGIN" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid or expired verification code");
      }

      await refreshUser();
      const role = json.data?.user?.role;

      // Automatically route user based on their authenticated database role
      if (role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/client/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!targetEmail || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, purpose: "LOGIN" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to resend code");
      }

      setSuccessMessage(`A fresh 6-digit code has been sent to ${targetEmail}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToForm = () => {
    setOtpSent(false);
    setOtp("");
    setError(null);
    setSuccessMessage(null);
  };

  // If checking existing session, show smooth loading state
  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] flex flex-col justify-center items-center p-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-600 font-semibold">
            Active session found. Redirecting to your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F4F0FD] text-[#1E1B4B] flex flex-col justify-center items-center p-4 sm:p-6 py-10 selection:bg-purple-100 selection:text-purple-800">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header with Stacked AI Agent Infra */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <BrandLogo size="lg" tagline="Enterprise AI Agent Infra" href="/" variant="light" />
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1B4B] mt-4">
            {otpSent
              ? "Verify Your Identity"
              : mode === "login"
              ? "Sign In to Your Workspace"
              : "Create Client Workspace"}
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-normal">
            {otpSent
              ? `Verification code dispatched to ${targetEmail}`
              : mode === "login"
              ? "Enter your email to receive a passwordless 6-digit passcode."
              : "Instant tenant onboarding with starter AI agent & live widget."}
          </p>
        </div>

        {/* Tab Switcher (Only visible before OTP is sent) */}
        {!otpSent && (
          <div className="flex p-1.5 mb-5 bg-purple-100/70 rounded-2xl border border-purple-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-purple-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-purple-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab("register")}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "register"
                  ? "bg-white text-purple-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-purple-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Register Workspace</span>
            </button>
          </div>
        )}

        {/* Auth Card */}
        <Card className="bg-white border border-purple-100/90 shadow-xl shadow-purple-950/5 rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 pt-6 px-6 sm:px-8">
            <CardTitle className="text-base font-bold text-[#1E1B4B]">
              {otpSent
                ? "Enter 6-digit passcode"
                : mode === "login"
                ? "Passwordless Sign In"
                : "Open Workspace Registration"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {otpSent
                ? `Enter the 6-digit code sent to ${targetEmail}`
                : mode === "login"
                ? "Works for Super Admins, Client Admins, and invited team members."
                : "Self-service onboarding: instantly launches your isolated tenant workspace."}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-7">
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {otpSent ? (
              /* ========================================================= */
              /* STEP: 6-DIGIT OTP VERIFICATION (COMMON FOR BOTH FLOWS)   */
              /* ========================================================= */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1E1B4B]">6-Digit Passcode</label>
                    <span className="text-[10px] text-slate-500 font-mono">Expires in 10 mins</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-10 text-center tracking-[8px] font-mono text-lg font-bold bg-purple-50/40 border-purple-200 text-[#1E1B4B] focus-visible:ring-purple-500 focus-visible:border-purple-600 rounded-xl"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otp.trim().length !== 6}
                  className="w-full font-bold shadow-md shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white h-11 rounded-xl"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      Verify & Open Workspace <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResetToForm}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-[#1E1B4B] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Resend code</span>
                  </button>
                </div>
              </form>
            ) : mode === "login" ? (
              /* ========================================================= */
              /* TAB 1: SIGN IN FORM (PASSWORDLESS EMAIL)                 */
              /* ========================================================= */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E1B4B]">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 focus-visible:border-purple-600 rounded-xl h-11"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full font-bold shadow-md shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white h-11 rounded-xl cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Passcode...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>

                <div className="pt-3 text-center text-xs text-slate-500 border-t border-purple-100">
                  <span>Need a new organization workspace? </span>
                  <button
                    type="button"
                    onClick={() => switchTab("register")}
                    className="text-purple-700 font-bold hover:underline cursor-pointer"
                  >
                    Register Workspace
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================================= */
              /* TAB 2: REGISTER WORKSPACE FORM (OPEN SELF-SERVICE)       */
              /* ========================================================= */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1E1B4B]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 focus-visible:border-purple-600 rounded-xl"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1E1B4B]">
                    Company / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Acme Technologies"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 focus-visible:border-purple-600 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1E1B4B]">
                    Work Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="alex@acme.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 focus-visible:border-purple-600 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1E1B4B]">
                      Mobile <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="pl-9 text-xs bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1E1B4B]">
                      Location <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="San Francisco, CA"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-9 text-xs bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Provisioning highlights */}
                <div className="p-3 rounded-2xl bg-purple-50/90 border border-purple-200 text-purple-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>What's included automatically:</span>
                  </div>
                  <ul className="text-slate-600 space-y-0.5 pl-5 list-disc text-[11px] leading-relaxed">
                    <li>Dedicated tenant workspace & Client Admin role</li>
                    <li>Pre-configured starter AI agent & live chat widget</li>
                    <li>Instant 6-digit OTP verification & access</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !fullName.trim() || !companyName.trim() || !registerEmail.trim()}
                  className="w-full font-bold shadow-md shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white h-11 rounded-xl cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Workspace...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      Create Workspace & Get Code <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="pt-3 text-center text-xs text-slate-500 border-t border-purple-100">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchTab("login")}
                    className="text-purple-700 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8FF] flex flex-col justify-center items-center p-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
