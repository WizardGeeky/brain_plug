"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, KeyRound, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to send login code");
      }

      setOtpSent(true);
      setSuccess("A 6-digit verification passcode has been sent to your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid or expired passcode");
      }

      await refreshUser();
      const role = json.data?.user?.role;
      if (role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F4F0FD] text-[#1E1B4B] flex flex-col justify-center items-center p-4 selection:bg-purple-100 selection:text-purple-800">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header with Stacked AI Agent Infra */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <BrandLogo size="lg" tagline="Enterprise AI Agent Infra" href="/" variant="light" />
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1B4B] mt-4">
            Passwordless Account Access
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Brain Plug uses secure 6-digit OTP verification instead of passwords
          </p>
        </div>

        <Card className="bg-white border border-purple-100 shadow-xl shadow-purple-950/5 rounded-3xl overflow-hidden">
          <CardHeader className="pt-6 px-6 sm:px-8 pb-3">
            <CardTitle className="text-base font-bold text-[#1E1B4B]">
              {otpSent ? "Enter verification passcode" : "Access Your Account"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {otpSent
                ? `Enter the 6-digit code sent to ${email}`
                : "Enter your registered email to receive an instant sign-in code."}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6">
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E1B4B]">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl h-11"
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
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Code...
                    </span>
                  ) : (
                    "Send Instant Sign-In Code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1E1B4B]">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <Input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-10 tracking-[8px] font-mono font-bold text-center text-lg bg-purple-50/40 border-purple-200 text-[#1E1B4B] focus-visible:ring-purple-500 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otp.trim().length !== 6}
                  className="w-full font-bold shadow-md shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white h-11 rounded-xl cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 pb-6 flex justify-center border-t border-purple-100 mt-2 pt-4">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-purple-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
