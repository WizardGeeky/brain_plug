"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { User, Phone, MapPin, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid onboarding token in URL");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName,
          mobile,
          location,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to complete onboarding");
      }

      await refreshUser();
      router.push("/client/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
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
            Complete Workspace Setup
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Set up your administrator profile and access your workspace
          </p>
        </div>

        <Card className="bg-white border border-purple-100 shadow-xl shadow-purple-950/5 rounded-3xl overflow-hidden">
          <CardHeader className="pt-6 px-6 sm:px-8 pb-3">
            <CardTitle className="text-base font-bold text-[#1E1B4B]">Profile Details</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Complete your account setup to start creating and deploying your AI agents. All logins use passwordless 6-digit OTP verification.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-7">
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E1B4B]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E1B4B]">
                  Mobile Phone <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E1B4B]">
                  Location / City <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 text-xs sm:text-sm bg-white border-purple-200 text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-purple-500 rounded-xl h-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !fullName.trim()}
                className="w-full font-bold shadow-md shadow-purple-500/20 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white h-11 rounded-xl cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing Setup...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    Launch Workspace <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8FF] flex flex-col justify-center items-center p-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
