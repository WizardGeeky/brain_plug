"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Save,
  Activity,
  AlertCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Sparkles,
  Layers,
  Globe,
  Lock,
  Zap,
  Check,
  Copy,
  Shield,
  Clock,
  Radio,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface GeminiModelItem {
  id: string;
  modelName: string;
  displayName: string;
  apiKey?: string;
  maskedApiKey?: string;
  provider: string;
  status: "ACTIVE" | "INACTIVE";
  isPublished: boolean;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  maxTokens?: number;
  createdAt: string;
}

const COMMON_GEMINI_MODELS = [
  {
    modelName: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    tag: "Recommended ⚡",
    desc: "Ultra-fast response latency (~1.2s) & high accuracy",
  },
  {
    modelName: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    tag: "High Efficiency 🚀",
    desc: "Lightweight, cost-efficient, and optimized for high volume chats",
  },
  {
    modelName: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    tag: "Reasoning 🧠",
    desc: "Deep reasoning and complex analytical intelligence",
  },
  {
    modelName: "gemini-2.0-flash-lite",
    displayName: "Gemini 2.0 Flash Lite",
    tag: "Ultra Low Latency ⚡",
    desc: "Lightweight and fastest response times for widgets",
  },
  {
    modelName: "text-embedding-004",
    displayName: "Text Embedding 004",
    tag: "Vector RAG 📚",
    desc: "768-dim high speed semantic document embeddings",
  },
];

export default function ModelsRegistryPage() {
  const [models, setModels] = useState<GeminiModelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Gemini Central API Key State
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    configured: boolean;
    source: string;
    maskedKey?: string;
  }>({ configured: false, source: "none" });
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Model Registration Form State
  const [formData, setFormData] = useState({
    apiKey: "",
    modelName: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });
  const [showModalKeyText, setShowModalKeyText] = useState(false);
  const [isSubmittingModel, setIsSubmittingModel] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [modelToDelete, setModelToDelete] = useState<GeminiModelItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSettingsAndModels = async () => {
    setIsLoading(true);
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        fetch("/api/v1/models"),
        fetch("/api/v1/settings"),
      ]);

      if (modelsRes.ok) {
        const mJson = await modelsRes.json();
        setModels(mJson.data || []);
      }

      if (settingsRes.ok) {
        const sJson = await settingsRes.json();
        if (sJson.data?.gemini) {
          setKeyStatus(sJson.data.gemini);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndModels();
  }, []);

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;
    setIsSavingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: geminiApiKey.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save Gemini API key");
      }

      setGeminiApiKey("");
      setTestResult({
        type: "success",
        message: "Gemini API key saved securely to database platform settings!",
      });
      fetchSettingsAndModels();
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: err.message || "Error saving API key",
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);

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
        setTestResult({
          type: "success",
          message: json.data.message || "Gemini API Key verified and active (Fast ping confirmed)!",
        });
      } else {
        setTestResult({
          type: "error",
          message:
            json.data?.message ||
            json.error?.message ||
            "Gemini API key verification failed. Please check key permissions in Google AI Studio.",
        });
      }
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: err.message || "Connection test failed",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const togglePublish = async (modelId: string, currentPublished: boolean) => {
    const endpoint = currentPublished ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/v1/models/${modelId}/${endpoint}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchSettingsAndModels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      apiKey: geminiApiKey.trim() || "",
      modelName: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash",
      status: "ACTIVE",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSelectPreset = (preset: { modelName: string; displayName: string }) => {
    setFormData((prev) => ({
      ...prev,
      modelName: preset.modelName,
      displayName: preset.displayName,
    }));
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.apiKey.trim() && !keyStatus.configured) {
      setFormError("Google Gemini API Key is required (or configure the central key).");
      return;
    }
    if (!formData.modelName.trim()) {
      setFormError("Model Name identifier is required.");
      return;
    }
    if (!formData.displayName.trim()) {
      setFormError("Display Name is required.");
      return;
    }

    setIsSubmittingModel(true);
    try {
      const res = await fetch("/api/v1/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: formData.apiKey.trim() || undefined,
          modelName: formData.modelName.trim(),
          displayName: formData.displayName.trim(),
          status: formData.status,
          isPublished: formData.status === "ACTIVE",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to register Gemini model.");
      }

      setShowAddModal(false);
      fetchSettingsAndModels();
    } catch (err: any) {
      setFormError(err.message || "An error occurred while creating the model.");
    } finally {
      setIsSubmittingModel(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/models/${modelToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setModelToDelete(null);
        fetchSettingsAndModels();
      } else {
        alert(json.error?.message || "Failed to delete model");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-hidden animate-fade-in pb-12">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-5 sm:p-7 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Gateway Live</span>
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-[11px] font-medium border-border/80">
                Google Gemini Engine
              </Badge>
              <Badge variant="glow" className="text-[10px] sm:text-[11px] font-semibold">
                Multi-Tenant Registry
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              Gemini AI Models & Gateway Registry
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Register, benchmark, and govern custom Google Gemini AI models and master credentials for all client tenant agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={fetchSettingsAndModels}
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-2xl border-border/80 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 sm:mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>

            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="font-semibold shadow-md shadow-primary/20 rounded-2xl text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" /> Register Model
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Gemini API Key Control Panel */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-primary shrink-0" />
              Central Google Gemini API Key (PostgreSQL Encrypted)
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={keyStatus.configured ? "success" : "destructive"}
                className="text-[10px] sm:text-[11px] font-semibold shrink-0"
              >
                {keyStatus.configured
                  ? `Active (${keyStatus.source.toUpperCase()})`
                  : "API Key Missing"}
              </Badge>
              {keyStatus.maskedKey && (
                <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/70">
                  {keyStatus.maskedKey}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All AI agent chat streaming, token calculation, and RAG document embeddings generated across all tenant workspaces utilize this database-configured key.
          </p>

          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1 min-w-0">
                <Input
                  type={showKeyText ? "text" : "password"}
                  placeholder={
                    keyStatus.configured
                      ? "Enter new Gemini API key to update database..."
                      : "AIzaSy..."
                  }
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="pr-10 text-xs font-mono rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  title={showKeyText ? "Hide key" : "Show key"}
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestKey}
                  disabled={isTestingKey || (!geminiApiKey.trim() && !keyStatus.configured)}
                  className="flex-1 sm:flex-none text-xs font-semibold rounded-xl"
                >
                  <Activity className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />
                  {isTestingKey ? "Testing..." : "Test Ping"}
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingKey || !geminiApiKey.trim()}
                  className="flex-1 sm:flex-none text-xs font-semibold rounded-xl shadow-sm shadow-primary/20"
                >
                  <Save className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {isSavingKey ? "Saving..." : "Save Key"}
                </Button>
              </div>
            </div>
          </form>

          {testResult && (
            <div
              className={`p-3 sm:p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                testResult.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300"
              }`}
            >
              {testResult.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Models Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary shrink-0" /> Published AI Models Registry ({models.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Models marked as <strong className="text-foreground">Published</strong> are available to client workspaces during agent creation.
          </p>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2.5" />
            Loading model registry from PostgreSQL...
          </div>
        ) : models.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-border/80 rounded-3xl p-8 bg-card/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Models Registered</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You have not registered any Gemini models yet. Click below to register your first model with your API key.
            </p>
            <Button onClick={handleOpenAddModal} size="sm" className="font-semibold mt-2 rounded-xl">
              <Plus className="w-3.5 h-3.5 mr-1" /> Register First Model
            </Button>
          </div>
        ) : (
          models.map((model) => (
            <div
              key={model.id}
              className="pro-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-border/80 shadow-xs hover:border-border transition-all h-full bg-card"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60 gap-2">
                  <Badge
                    variant={model.isPublished && model.status === "ACTIVE" ? "success" : "secondary"}
                    className="text-[10px] font-semibold shrink-0"
                  >
                    {model.isPublished && model.status === "ACTIVE"
                      ? "Published (Live)"
                      : "Unpublished"}
                  </Badge>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/20">
                      {model.provider || "Google"}
                    </Badge>
                    {model.modelName.includes("flash") && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                        ⚡ 1.2s Fast
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {model.displayName}
                  </h3>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                    {model.modelName}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1.5 text-xs font-normal">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] shrink-0">
                      <Key className="w-3 h-3 text-primary shrink-0" /> API Key:
                    </span>
                    <span className="font-mono text-[10px] sm:text-[11px] font-medium text-foreground truncate">
                      {model.maskedApiKey ? model.maskedApiKey : "Master Platform Key"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] shrink-0">
                      <Activity className="w-3 h-3 text-emerald-500 shrink-0" /> Engine Status:
                    </span>
                    <span className="font-semibold text-foreground text-[11px]">{model.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] shrink-0">
                      <Zap className="w-3 h-3 text-amber-500 shrink-0" /> Capabilities:
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Streaming SSE • 8k Tokens
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border/70 flex items-center gap-2">
                <Button
                  variant={model.isPublished ? "outline" : "default"}
                  size="sm"
                  onClick={() => togglePublish(model.id, model.isPublished)}
                  className="flex-1 text-xs font-semibold rounded-xl"
                >
                  {model.isPublished ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Publish
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setModelToDelete(model)}
                  className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-xl"
                  title="Delete Model"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simplified Register New Gemini Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-7 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Register New Gemini Model</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Add a Google Gemini model to your fleet</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateModel} className="space-y-3.5 text-xs">
              {/* 1. Model Identifier & Presets */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                  Model Identifier <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. gemini-2.0-flash"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="text-xs font-mono rounded-xl"
                />

                {/* Quick-fill preset buttons */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground">Google Verified Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_GEMINI_MODELS.map((preset) => (
                      <button
                        key={preset.modelName}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1 ${
                          formData.modelName === preset.modelName
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                            : "bg-muted/50 border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        <span>{preset.modelName}</span>
                        <span className="text-[9px] opacity-80">{preset.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Display Name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  Display Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Gemini 2.5 Flash"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* 3. API Key (Optional override if central key exists) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-primary shrink-0" />
                    Dedicated API Key Override <span className="text-muted-foreground font-normal">(Optional)</span>
                  </span>
                  {keyStatus.configured && (
                    <span className="text-[10px] text-emerald-500 font-normal">Master Key Configured</span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    type={showModalKeyText ? "text" : "password"}
                    placeholder={
                      keyStatus.configured
                        ? "Leave blank to inherit central master key..."
                        : "AIzaSy..."
                    }
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="pr-10 text-xs font-mono rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalKeyText(!showModalKeyText)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showModalKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. Status */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
                  }
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ACTIVE">ACTIVE (Published & Selectable by Tenants)</option>
                  <option value="INACTIVE">INACTIVE (Draft / Admin Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingModel}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingModel}
                  className="text-xs font-semibold shadow-sm shadow-primary/20 rounded-xl"
                >
                  {isSubmittingModel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Registering...
                    </>
                  ) : (
                    "Register Model"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Delete AI Model?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete <strong>{modelToDelete.displayName}</strong> (<span className="font-mono">{modelToDelete.modelName}</span>) from the platform model registry?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModelToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteModel}
                disabled={isDeleting}
                className="text-xs font-semibold shadow-sm shadow-red-500/20 rounded-xl"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
