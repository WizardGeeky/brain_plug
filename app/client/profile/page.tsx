"use client";

import React, { useEffect, useState } from "react";
import { User, Mail, Smartphone, Shield, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
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
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobile, location }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Loading profile coordinates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Badge variant="glow" className="text-[10px] font-semibold">
                  {profile?.currentRole || "CLIENT_ADMIN"}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {profile?.fullName || "User Profile"}
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                {profile?.email || "user@brainplug.ai"}
              </p>
            </div>
          </div>

          <Button
            onClick={load}
            variant="outline"
            size="sm"
            className="text-xs font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details Form */}
        <Card className="md:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-base font-bold text-foreground">Personal Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email Address (Primary Identity)</label>
                <Input
                  disabled
                  value={profile?.email || ""}
                  className="text-xs bg-muted/60 text-muted-foreground font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Login passcodes and security verification notifications are dispatched to this address.
                </p>
              </div>

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

              <div className="flex items-center justify-between pt-3 border-t border-border/70">
                {saved ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile Updated!
                  </span>
                ) : <span />}

                <Button type="submit" className="text-xs font-semibold shadow-md shadow-primary/20">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Profile Details
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Roles & Active Sessions */}
        <div className="space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base font-bold text-foreground">Workspace Authority</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Assigned Role:</span>
                <Badge variant="primary" className="font-bold text-[10px]">{profile?.currentRole || "CLIENT_ADMIN"}</Badge>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="success" className="text-[10px]">{profile?.status || "ACTIVE"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-base font-bold text-foreground">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
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
                      {s.userAgent || "Desktop Browser"}
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
