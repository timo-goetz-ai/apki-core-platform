import { NextRequest, NextResponse } from "next/server";
import { promptStore, generateId, type CorporatePrompt, type PromptCategory } from "@/lib/prompt-store";

export const dynamic = "force-dynamic";

/** GET /api/corporate-prompts?category=coding&pinned=true */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as PromptCategory | null;
  const pinned   = searchParams.get("pinned");

  let prompts = promptStore.prompts;
  if (category) prompts = prompts.filter(p => p.category === category);
  if (pinned === "true") prompts = prompts.filter(p => p.pinned);

  // Pinned first, then by usageCount desc
  prompts = [...prompts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.usageCount - a.usageCount;
  });

  return NextResponse.json({ count: prompts.length, prompts });
}

/** POST /api/corporate-prompts — Neuen Prompt anlegen */
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const body = await request.json();
  const now = new Date().toISOString();

  const prompt: CorporatePrompt = {
    id:         generateId(),
    name:       body.name ?? "Neuer Prompt",
    category:   body.category ?? "custom",
    content:    body.content ?? "",
    model:      body.model ?? "claude-sonnet-4-6",
    tags:       Array.isArray(body.tags) ? body.tags : [],
    pinned:     body.pinned ?? false,
    createdAt:  now,
    updatedAt:  now,
    usageCount: 0,
  };

  promptStore.prompts.push(prompt);
  return NextResponse.json({ ok: true, prompt }, { status: 201 });
}

/** PATCH /api/corporate-prompts?id=xxx — Prompt updaten */
export async function PATCH(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const id = new URL(request.url).searchParams.get("id");
  const idx = promptStore.prompts.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const body = await request.json();
  promptStore.prompts[idx] = {
    ...promptStore.prompts[idx],
    ...body,
    id: promptStore.prompts[idx].id, // id nicht überschreibbar
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, prompt: promptStore.prompts[idx] });
}

/** DELETE /api/corporate-prompts?id=xxx */
export async function DELETE(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const id = new URL(request.url).searchParams.get("id");
  const before = promptStore.prompts.length;
  promptStore.prompts = promptStore.prompts.filter(p => p.id !== id);

  return NextResponse.json({ ok: promptStore.prompts.length < before });
}
