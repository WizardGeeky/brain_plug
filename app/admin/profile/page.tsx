"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/me");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setProfile(json.data);
          setFullName(json.data.fullName || "");
          setMobile(json.data.mobile || "");
          setLocation(json.data.location || "");
          setGender(json.data.gender || "MALE");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
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
        throw new Error(json.error?.message || "Failed to update profile");
      }

      setFeedback({
        type: "success",
        message: "Profile updated successfully!",
      });

      loadProfile();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {profile?.fullName?.charAt(0) || "S"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Badge variant="glow" className="text-[10px] font-semibold">
                  {profile?.currentRole || "SUPER_ADMIN"}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {profile?.fullName || "Administrator Profile"}
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                {profile?.email || "admin@brainplug.ai"}
              </p>
            </div>
          </div>

          <Button
            onClick={loadProfile}
            variant="outline"
            size="sm"
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Form */}
        <Card className="lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Personal Profile Information</CardTitle>
            <p className="text-xs text-muted-foreground">Manage your identity and administrator contact coordinates</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
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
                  disabled={isSaving}
                  size="lg"
                  className="font-semibold text-xs shadow-md shadow-primary/20"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSaving ? "Saving Profile..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Access Rights & Active Sessions */}
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
    </div>
  );
}
