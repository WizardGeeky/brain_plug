"use client";

import React, { useState } from "react";
import { Sliders, Save, Building2, Shield, Globe, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ClientSettingsPage() {
  const [companyName, setCompanyName] = useState("Acme Corporation");
  const [supportEmail, setSupportEmail] = useState("contact@acme.com");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl animate-fade-in">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Badge variant="glow" className="text-[10px] font-semibold">
                Workspace Preferences
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Tenant Workspace Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Manage organization branding, customer contact coordinates, and security configurations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4 text-primary" /> Organization Branding & Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Company / Tenant Name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Support / Billing Contact Email</label>
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
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Shield className="w-4 h-4 text-emerald-500" /> Data & Security Isolation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2 text-xs">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Tenant Partitioning Active:</strong> All your agents, documents, vector embeddings, conversations, and API keys are strictly partitioned in PostgreSQL with encrypted storage paths.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Workspace Settings Saved!
            </span>
          )}
          <Button type="submit" className="font-semibold text-xs shadow-md shadow-primary/20">
            <Save className="w-4 h-4 mr-1.5" />
            Save Workspace Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
