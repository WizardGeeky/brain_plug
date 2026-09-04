"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  Sparkles,
  AlertTriangle,
  Type,
  FileUp,
  Plus,
  Check,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TEXT_TEMPLATES = [
  {
    label: "FAQ Format",
    title: "Customer Support FAQs",
    content: `Q: What is the delivery timeframe?
A: Standard shipping takes 3-5 business days. Express shipping delivers in 1-2 business days.

Q: How do I request a refund or return?
A: You can return items within 30 days of receipt in original condition. Contact support to initiate a return label.

Q: What payment methods are accepted?
A: We accept Visa, MasterCard, American Express, PayPal, and Apple Pay.`,
  },
  {
    label: "Company Policy",
    title: "Service Terms & Security Policy",
    content: `COMPANY POLICIES & GUIDELINES

1. Privacy & Security: Customer data is encrypted with AES-256 and never shared with third parties.
2. Service Level Agreement: Support requests are answered within 2 hours during business hours (9 AM - 6 PM EST).
3. Warranty Coverage: Hardware products include a 1-year limited warranty against manufacturing defects.`,
  },
  {
    label: "Product Specs",
    title: "Product Specifications & Features",
    content: `PRODUCT: Brain Plug Enterprise AI Platform

Core Capabilities:
- RAG Vector Knowledge Retrieval over PDF, DOCX, Spreadsheets, and Text.
- Embeddable web chat widgets with custom theme styling.
- Multi-tenant tenant data isolation and scoped API keys.
- Real-time streaming completions powered by Google Gemini.`,
  },
];

export default function AgentKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: agentId } = use(params);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeMode, setActiveMode] = useState<"files" | "text">("files");

  // File Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // Text Knowledge state
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [textSuccess, setTextSuccess] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Delete state
  const [docToDelete, setDocToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/knowledge`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [agentId]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agentId", agentId);

      try {
        await fetch(`/api/v1/agents/${agentId}/knowledge`, {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setIsUploading(false);
    fetchDocs();
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTextError(null);

    if (!textContent.trim()) {
      setTextError("Please provide some text content for the knowledge note.");
      return;
    }

    setIsSubmittingText(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textTitle.trim() || "Knowledge Note",
          content: textContent.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTextSuccess(true);
        setTextTitle("");
        setTextContent("");
        setTimeout(() => setTextSuccess(false), 3000);
        fetchDocs();
      } else {
        setTextError(json.error?.message || "Failed to process text knowledge");
      }
    } catch (err: any) {
      setTextError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingText(false);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/documents/${docToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocToDelete(null);
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes("sheet") || mimeType.includes("csv") || mimeType.includes("excel"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mimeType.includes("json") || mimeType.includes("code") || mimeType.includes("xml"))
      return <FileCode className="w-5 h-5 text-indigo-500" />;
    return <File className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Ambient Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-card via-card to-card/90 border border-border/80 p-6 sm:p-8 shadow-sm ambient-glow-mesh overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/client/agents/${agentId}`}
              className="p-2.5 rounded-2xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Badge variant="glow" className="text-[10px] font-semibold">
                  Vector RAG Grounding
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Knowledge Base & Grounding
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                Feed knowledge to your AI agent using uploaded files (PDF, DOCX, CSV) or direct plain text notes & FAQs.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchDocs} className="text-xs font-semibold shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveMode("files")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMode === "files"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileUp className="w-3.5 h-3.5" /> 📄 Upload Documents & Files
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("text")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMode === "text"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Type className="w-3.5 h-3.5" /> ✍️ Write or Paste Text / FAQs
        </button>
      </div>

      {/* MODE 1: FILE UPLOAD */}
      {activeMode === "files" && (
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed transition-all p-8 text-center cursor-pointer shadow-sm ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border/80 hover:border-primary/50 bg-muted/20"
          }`}
          onClick={() => document.getElementById("file-input-knowledge")?.click()}
        >
          <input
            id="file-input-knowledge"
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.xml"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-sm text-foreground">
            {isUploading ? "Uploading & Vector Chunking..." : "Click or Drag & Drop Documents to Ingest"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            Supports PDF, Word (.docx), Excel spreadsheets (.xlsx), CSV, Text (.txt), and Markdown.
          </p>
        </Card>
      )}

      {/* MODE 2: DIRECT TEXT / FAQ KNOWLEDGE INPUT */}
      {activeMode === "text" && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" /> Direct Text Knowledge Feed
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Type or paste knowledge articles, FAQs, company policies, or markdown notes directly.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {textSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Text knowledge ingested and vectorized successfully!
              </div>
            )}

            {textError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {textError}
              </div>
            )}

            {/* Template Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium">Quick Template Presets:</span>
              {TEXT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => {
                    setTextTitle(tmpl.title);
                    setTextContent(tmpl.content);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-border/80 bg-muted/40 hover:border-primary/50 text-foreground text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-primary" /> {tmpl.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Knowledge Title / Topic</label>
                <Input
                  required
                  placeholder="e.g. Return Policy & Refund FAQ"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Knowledge Text Content <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">Supports plain text & Markdown</span>
                </label>
                <textarea
                  rows={9}
                  required
                  placeholder="Paste or type knowledge notes, FAQs, product details, or procedures..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 p-3.5 bg-background text-xs text-foreground outline-none focus:border-primary font-mono leading-relaxed shadow-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingText || !textContent.trim()}
                  className="text-xs font-semibold shadow-md shadow-primary/20 px-6"
                >
                  {isSubmittingText ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Vectorizing & Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Save & Ingest Text Knowledge
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents & Text Sources List */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Database className="w-4 h-4 text-primary" /> Ingested Knowledge Sources ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Knowledge Source</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Vector Status</th>
                  <th className="px-6 py-4">Chunks Indexed</th>
                  <th className="px-6 py-4">Ingested Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto text-primary mb-2" />
                      Loading knowledge documents...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground space-y-2">
                      <Database className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="font-semibold text-foreground">No knowledge sources ingested yet.</p>
                      <p className="text-xs text-muted-foreground">
                        Upload files or write text notes above to ground this agent with your company knowledge.
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isTextNote = doc.storagePath === "raw_text";

                    return (
                      <tr key={doc.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.mimeType)}
                            <div>
                              <div className="font-bold text-foreground truncate max-w-xs">{doc.fileName}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {(doc.fileSize / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {isTextNote ? "✍️ Text Note" : "📄 File Document"}
                          </Badge>
                        </td>

                        <td className="px-6 py-4">
                          <Badge
                            variant={doc.status === "PROCESSED" ? "success" : doc.status === "FAILED" ? "destructive" : "secondary"}
                            className="text-[10px] font-semibold"
                          >
                            {doc.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-foreground">
                          {doc._count?.chunks || doc.chunkCount || 0} chunks ({doc.tokenCount || 0} tokens)
                        </td>

                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDocToDelete(doc)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-8 px-2"
                            title="Delete Knowledge Document"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Knowledge File?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to remove <strong className="text-foreground">{docToDelete.fileName}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-2xl border border-border/60">
              All associated vector embeddings and chunked content will be permanently removed from this agent's knowledge base.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="text-xs font-semibold"
              >
                {isDeleting ? "Deleting..." : "Delete File"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
