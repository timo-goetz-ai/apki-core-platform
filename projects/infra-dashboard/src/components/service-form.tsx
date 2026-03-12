"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceConfig } from "@/lib/types";

const iconOptions = ["server", "workflow", "table", "activity", "database", "globe"];
const categoryOptions = ["infrastructure", "automation", "database", "monitoring", "other"];

interface ServiceFormProps {
  service?: ServiceConfig;
  onClose: () => void;
}

export function ServiceForm({ service, onClose }: ServiceFormProps) {
  const router = useRouter();
  const isEdit = !!service;

  const [form, setForm] = useState({
    id: service?.id ?? "",
    name: service?.name ?? "",
    url: service?.url ?? "https://",
    icon: service?.icon ?? "globe",
    category: service?.category ?? "other",
    healthEndpoint: service?.healthEndpoint ?? "",
    description: service?.description ?? "",
    headers: JSON.stringify(service?.headers ?? {}, null, 2),
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(form.headers);
    } catch {
      setError("Headers must be valid JSON");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      healthEndpoint: form.healthEndpoint || form.url,
      headers,
    };

    try {
      const res = await fetch("/api/services", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-4"
      >
        <h2 className="text-xl font-bold">
          {isEdit ? "Service bearbeiten" : "Neuer Service"}
        </h2>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={isEdit}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Health Endpoint (leer = gleiche URL)
          </label>
          <input
            type="url"
            value={form.healthEndpoint}
            onChange={(e) => setForm({ ...form, healthEndpoint: e.target.value })}
            placeholder={form.url}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Beschreibung</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Icon</label>
            <select
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Kategorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Headers (JSON)
          </label>
          <textarea
            value={form.headers}
            onChange={(e) => setForm({ ...form, headers: e.target.value })}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? "Speichern..." : isEdit ? "Aktualisieren" : "Hinzufuegen"}
          </button>
        </div>
      </form>
    </div>
  );
}
