"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Save,
  Shield,
  Key,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Clock,
  Sparkles,
  RefreshCw,
  User,
  Smartphone,
  MapPin,
  Phone,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"PLATFORM" | "GEMINI" | "PROFILE">("PLATFORM");

  // Platform Settings State
  const [appName, setAppName] = useState("Brain Plug");
  const [supportEmail, setSupportEmail] = useState("support@brainplug.ai");
  const [otpExpiry, setOtpExpiry] = useState(5);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    configured: boolean;
    source: string;
    maskedKey?: string;
  }>({ configured: false, source: "none" });

  // Profile State
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadAll = async () => {
    try {
      const [settingsRes, profileRes] = await Promise.all([
        fetch("/api/v1/settings"),
        fetch("/api/v1/me"),
      ]);

      if (settingsRes.ok) {
        const json = await settingsRes.json();
        if (json.data?.general) {
          setAppName(json.data.general.brandName || "Brain Plug");
          setSupportEmail(json.data.general.supportEmail || "support@brainplug.ai");
          setOtpExpiry(json.data.general.otpExpiryMinutes || 5);
        }
        if (json.data?.gemini) {
          setKeyStatus(json.data.gemini);
        }
      }

      if (profileRes.ok) {
        const pJson = await profileRes.json();
        if (pJson.data) {
          setProfile(pJson.data);
          setFullName(pJson.data.fullName || "");
          setMobile(pJson.data.mobile || "");
          setLocation(pJson.data.location || "");
          setGender(pJson.data.gender || "MALE");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: appName,
          supportEmail,
          otpExpiryMinutes: otpExpiry,
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update platform settings");
      }

      setGeminiApiKey("");
      setFeedback({
        type: "success",
        message: "Platform settings and Gemini credentials updated successfully in PostgreSQL!",
      });

      loadAll();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: mobile.trim() || undefined,
          location: location.trim() || undefined,
          gender,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update administrator profile");
      }

      setFeedback({
        type: "success",
        message: "Your Super Admin profile has been updated successfully!",
      });

      loadAll();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update profile",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/settings/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: geminiApiKey.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data?.valid) {
        setFeedback({
          type: "success",
          message: json.data.message || "Gemini API Key verified and active!",
        });
      } else {
        setFeedback({
          type: "error",
          message:
            json.data?.message ||
            json.error?.message ||
            "Gemini API key verification failed.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Connection test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Control & Preferences Center
            </span>
            <Badge variant="glow" className="text-[10px] font-semibold">
              Super Admin Space
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Settings & Profile Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Configure central Google Gemini provider keys, organization branding metadata, and manage your administrator profile.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 border border-border/80 rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => {
            setActiveTab("PLATFORM");
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "PLATFORM"
              ? "bg-card text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Platform Configuration
        </button>

        <button
          onClick={() => {
            setActiveTab("GEMINI");
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "GEMINI"
              ? "bg-card text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Key className="w-3.5 h-3.5" /> Gemini API Gateway
        </button>

        <button
          onClick={() => {
            setActiveTab("PROFILE");
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "PROFILE"
              ? "bg-card text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-3.5 h-3.5" /> Admin Profile & Security
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: Platform Configuration */}
      {activeTab === "PLATFORM" && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">General Platform Metadata</CardTitle>
              <p className="text-xs text-muted-foreground">Branding and global contact coordinates</p>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Platform Brand Name</label>
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Support Contact Email</label>
                <Input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Security & Authentication Defaults</CardTitle>
              <p className="text-xs text-muted-foreground">OTP lifetimes and encryption standards</p>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">OTP Code Expiration Window (Minutes)</label>
                <Input
                  type="number"
                  value={otpExpiry}
                  onChange={(e) => setOtpExpiry(parseInt(e.target.value, 10))}
                  className="text-xs"
                />
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-[11px] text-muted-foreground">
                🔐 <strong>AES-256-GCM Encryption</strong> is active across all user sessions, refresh tokens, and database secrets.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} size="lg" className="font-semibold text-xs shadow-md shadow-primary/20">
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? "Saving Settings..." : "Save Platform Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: Gemini API Gateway */}
      {activeTab === "GEMINI" && (
        <div className="space-y-6">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Google Gemini API Provider Key (Central Vault)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={keyStatus.configured ? "success" : "destructive"}
                    className="text-[10px] font-semibold"
                  >
                    {keyStatus.configured
                      ? `Active (${keyStatus.source.toUpperCase()})`
                      : "Not Configured"}
                  </Badge>
                  {keyStatus.maskedKey && (
                    <span className="text-xs font-mono text-muted-foreground font-semibold">
                      [{keyStatus.maskedKey}]
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                This API key is stored securely in PostgreSQL and used by all tenants for Gemini streaming chat and vector embeddings generation.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Update Gemini API Key</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      type={showKeyText ? "text" : "password"}
                      placeholder={
                        keyStatus.configured
                          ? "Enter new Gemini API key to update..."
                          : "AIzaSy..."
                      }
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestKey}
                    disabled={isTesting || (!geminiApiKey.trim() && !keyStatus.configured)}
                    className="text-xs font-semibold shrink-0"
                  >
                    <Activity className="w-3.5 h-3.5 mr-1 text-primary" />
                    {isTesting ? "Testing..." : "Test Connection"}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSavePlatformSettings}
                    disabled={isSaving || !geminiApiKey.trim()}
                    size="sm"
                    className="text-xs font-semibold shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {isSaving ? "Saving..." : "Save Key to DB"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Admin Profile & Security */}
      {activeTab === "PROFILE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Personal Profile Information</CardTitle>
              <p className="text-xs text-muted-foreground">Update your identity and administrator contact coordinates</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Full Name</label>
                    <Input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-border/80 p-2.5 bg-background text-xs text-foreground font-medium shadow-xs"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Email Address (Primary Identity)</label>
                  <Input
                    disabled
                    value={profile?.email || ""}
                    className="text-xs bg-muted/60 text-muted-foreground font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Passwordless OTP authentication credentials are tied to this email.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Mobile Phone</label>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Location / Region</label>
                    <Input
                      placeholder="San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border/70">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    size="lg"
                    className="font-semibold text-xs shadow-md shadow-primary/20"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSavingProfile ? "Saving Profile..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Role & Active Sessions */}
          <div className="space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Privilege & Authority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Authority Level:</span>
                  <Badge variant="primary" className="font-bold text-[10px]">
                    {profile?.currentRole || "SUPER_ADMIN"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Account Status:</span>
                  <Badge variant="success" className="text-[10px]">
                    {profile?.status || "ACTIVE"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Security Protocol:</span>
                  <span className="font-mono font-bold text-primary">AES-256-GCM</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Active Authenticated Sessions</CardTitle>
                <p className="text-xs text-muted-foreground">Recent verified client devices</p>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {!profile?.sessions?.length ? (
                  <div className="text-muted-foreground text-center py-4">No active session records found.</div>
                ) : (
                  profile.sessions.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Smartphone className="w-3.5 h-3.5 text-primary" />
                          <span>{s.ipAddress || "127.0.0.1"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(s.lastActiveAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {s.userAgent || "Desktop Web Browser"}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
