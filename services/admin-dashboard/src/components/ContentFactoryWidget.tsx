"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Zap, FileText, Image as ImageIcon, Volume2, Share2, CheckCircle2,
  Loader2, Download, Eye, Youtube, Wand2, AlertCircle, ChevronDown
} from "lucide-react";

type StepId = "blog" | "hero" | "social" | "thumbnail" | "voice";
type StepStatus = "idle" | "running" | "done" | "error" | "skipped";

interface PipelineStep {
  id: StepId;
  label: string;
  icon: React.ReactNode;
  requiresKey: "PICSART" | "FISH_AUDIO" | null;
}

const STEPS: PipelineStep[] = [
  { id: "blog",      label: "Blog generieren",      icon: <FileText className="w-4 h-4" />,  requiresKey: null },
  { id: "hero",      label: "Hero-Image",            icon: <ImageIcon className="w-4 h-4" />,     requiresKey: "PICSART" },
  { id: "social",    label: "Social Media Assets",   icon: <Share2 className="w-4 h-4" />,    requiresKey: "PICSART" },
  { id: "thumbnail", label: "YouTube Thumbnail",     icon: <Youtube className="w-4 h-4" />,   requiresKey: "PICSART" },
  { id: "voice",     label: "Voice-Over",            icon: <Volume2 className="w-4 h-4" />,   requiresKey: "FISH_AUDIO" },
];

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "👤", linkedin: "💼", twitter: "🐦",
};

export default function ContentFactoryWidget() {
  const [topic, setTopic]       = useState("");
  const [category, setCategory] = useState("KI & Technologie");
  const [selectedSteps, setSelectedSteps] = useState<StepId[]>(["blog", "hero", "social", "voice"]);
  const [status, setStatus]     = useState<Record<StepId, StepStatus>>({
    blog: "idle", hero: "idle", social: "idle", thumbnail: "idle", voice: "idle",
  });
  const [running, setRunning]   = useState(false);
  const [result, setResult]     = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [showBlog, setShowBlog] = useState(false);

  const toggleStep = (id: StepId) => {
    setSelectedSteps(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const runPipeline = async () => {
    if (!topic.trim()) return;
    setRunning(true);
    setResult(null);
    setErrors({});

    // Animate steps one by one
    const newStatus: Record<StepId, StepStatus> = {
      blog: "idle", hero: "idle", social: "idle", thumbnail: "idle", voice: "idle",
    };
    for (const s of STEPS) {
      newStatus[s.id] = selectedSteps.includes(s.id) ? "running" : "skipped";
    }
    setStatus({ ...newStatus });

    try {
      const res = await fetch("/api/content-factory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          title: topic,
          category,
          steps: selectedSteps,
        }),
      });

      const data = await res.json();

      // Update step status from result
      const finalStatus: Record<StepId, StepStatus> = { ...newStatus };
      for (const step of STEPS) {
        if (!selectedSteps.includes(step.id)) {
          finalStatus[step.id] = "skipped";
        } else if (data.errors?.[step.id]) {
          finalStatus[step.id] = "error";
        } else if (data.result?.[step.id]) {
          finalStatus[step.id] = "done";
        } else {
          finalStatus[step.id] = "idle";
        }
      }
      setStatus(finalStatus);
      setResult(data.result ?? {});
      setErrors(data.errors ?? {});
    } catch (e) {
      const errStatus: Record<StepId, StepStatus> = { ...newStatus };
      for (const s of selectedSteps) errStatus[s] = "error";
      setStatus(errStatus);
    } finally {
      setRunning(false);
    }
  };

  const doneCount = Object.values(status).filter(s => s === "done").length;
  const totalSelected = selectedSteps.length;
  const progress = totalSelected > 0 ? Math.round((doneCount / totalSelected) * 100) : 0;

  const stepsResult = result as Record<string, Record<string, unknown>> | null;

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-bold text-white">Content Factory</h2>
        <span className="ml-auto text-xs text-slate-500">Blog · Bild · Voice · Social</span>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Thema / Titel eingeben..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !running && runPipeline()}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-yellow-500 outline-none"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none"
          >
            {["KI & Technologie", "Business", "Marketing", "Gesundheit", "Finanzen", "Lifestyle"].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Step Toggles ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => {
          const active = selectedSteps.includes(step.id);
          return (
            <button
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
                active
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
            >
              {step.icon}
              {step.label}
              {step.requiresKey && (
                <span className={`ml-1 text-[10px] ${
                  step.requiresKey === "PICSART" ? "text-purple-400" : "text-green-400"
                }`}>
                  {step.requiresKey === "PICSART" ? "PRO" : "TTS"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Run Button ─────────────────────────────────────────────────── */}
      <button
        onClick={runPipeline}
        disabled={!topic.trim() || running || selectedSteps.length === 0}
        className="w-full py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Pipeline läuft… {progress > 0 && `(${progress}%)`}
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Content Pipeline starten
          </>
        )}
      </button>

      {/* ── Progress Bar ───────────────────────────────────────────────── */}
      {running && (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Step Status ────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {STEPS.map(step => {
          const s = status[step.id];
          const err = errors[step.id];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                s === "done"    ? "bg-green-500/10 border border-green-500/20"
                : s === "running" ? "bg-blue-500/10 border border-blue-500/20"
                : s === "error"   ? "bg-red-500/10 border border-red-500/20"
                : s === "skipped" ? "opacity-30 bg-slate-800"
                : "bg-slate-800/50"
              }`}
            >
              <span className="text-slate-400">{step.icon}</span>
              <span className={`flex-1 ${s === "done" ? "text-green-300" : s === "error" ? "text-red-300" : "text-slate-300"}`}>
                {step.label}
              </span>
              {s === "done"    && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {s === "running" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
              {s === "error"   && (
                <span className="text-red-400 text-[10px] max-w-[120px] truncate" title={err}>
                  {err?.includes("nicht gesetzt") ? "Key fehlt" : "Fehler"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-3 pt-1 border-t border-slate-800">

          {/* Blog */}
          {stepsResult?.blog && (
            <div className="bg-slate-800/60 rounded-lg p-3">
              <button
                onClick={() => setShowBlog(v => !v)}
                className="flex items-center gap-2 w-full text-left"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white flex-1">Blog Post</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showBlog ? "rotate-180" : ""}`} />
              </button>
              {showBlog && (
                <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {String(stepsResult.blog.excerpt ?? stepsResult.blog.content ?? "")}
                </div>
              )}
            </div>
          )}

          {/* Hero Image */}
          {stepsResult?.hero && (
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <div className="relative h-40 w-full">
                <Image
                  src={String((stepsResult.hero as Record<string, unknown>).imageUrl ?? "")}
                  alt="Generiertes Hero-Bild"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-400 flex-1">Hero Image (1920×1080)</span>
                <a
                  href={String((stepsResult.hero as Record<string, unknown>).imageUrl ?? "")}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
          )}

          {/* Social Assets */}
          {stepsResult?.social && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Social Media Assets</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(stepsResult.social as Record<string, string>).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded border border-slate-700">
                    <Image src={url} alt={`Vorschau ${platform}`} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <span className="text-lg">{SOCIAL_ICONS[platform] ?? "📱"}</span>
                      <span className="text-[10px] text-white capitalize">{platform}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Thumbnail */}
          {stepsResult?.thumbnail && (
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <div className="relative h-28 w-full">
                <Image
                  src={String(stepsResult.thumbnail)}
                  alt="YouTube-Thumbnail"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="px-3 py-1.5 bg-slate-800 flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-slate-400 flex-1">YouTube Thumbnail (1280×720)</span>
              </div>
            </div>
          )}

          {/* Voice-Over */}
          {stepsResult?.voice && (
            <div className="bg-slate-800/60 rounded-lg p-3 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Voice-Over</p>
                <audio controls className="w-full mt-1 h-8"
                  src={String((stepsResult.voice as Record<string, unknown>).audioDataUrl ?? "")} />
              </div>
            </div>
          )}

          {/* Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">Fehlende API-Keys</span>
              </div>
              <div className="space-y-1">
                {Object.entries(errors).map(([step, msg]) => (
                  <p key={step} className="text-[11px] text-slate-400">
                    <span className="text-amber-400 font-mono">{step}:</span> {msg}
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                → Keys in Coolify/Docker Env eintragen: PICSART_API_KEY, FISH_AUDIO_API_KEY
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
