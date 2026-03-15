import {
  ActionPanel, Action, List, showToast, Toast,
  getPreferenceValues, Clipboard, Detail,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

interface Preferences { dashboardUrl: string; apiKey: string; }
interface Prompt {
  id: string; name: string; category: string; content: string;
  model: string; tags: string[]; pinned: boolean; usageCount: number;
}

const CAT_EMOJI: Record<string, string> = {
  system: "⚙️", coding: "💻", ops: "🔧", analysis: "🔍",
  writing: "✍️", customer: "🤝", custom: "📝",
};

export default function CopyPrompt() {
  const prefs = getPreferenceValues<Preferences>();
  const [selected, setSelected] = useState<Prompt | null>(null);

  const { data, isLoading } = useFetch<{ prompts: Prompt[] }>(
    `${prefs.dashboardUrl}/api/corporate-prompts`,
    { headers: { Authorization: `Bearer ${prefs.apiKey}` }, keepPreviousData: true }
  );

  async function copyAndTrack(prompt: Prompt) {
    await Clipboard.copy(prompt.content);
    // Increment usage counter
    await fetch(`${prefs.dashboardUrl}/api/corporate-prompts?id=${prompt.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${prefs.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ usageCount: prompt.usageCount + 1 }),
    }).catch(() => {});
    await showToast({ style: Toast.Style.Success, title: `"${prompt.name}" kopiert` });
  }

  if (selected) {
    return (
      <Detail
        markdown={`# ${selected.name}\n\n\`\`\`\n${selected.content}\n\`\`\`\n\n**Modell:** ${selected.model}  \n**Kategorie:** ${selected.category}  \n**Tags:** ${selected.tags.join(", ") || "–"}`}
        actions={
          <ActionPanel>
            <Action title="Kopieren & Schließen" icon="📋" onAction={() => copyAndTrack(selected)} />
            <Action title="Zurück" icon="⬅️" onAction={() => setSelected(null)} />
          </ActionPanel>
        }
      />
    );
  }

  const prompts = data?.prompts ?? [];
  const pinned = prompts.filter(p => p.pinned);
  const rest   = prompts.filter(p => !p.pinned);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Prompt suchen…">
      {pinned.length > 0 && (
        <List.Section title="📌 Gepinnt">
          {pinned.map(p => <PromptItem key={p.id} prompt={p} onCopy={copyAndTrack} onPreview={setSelected} />)}
        </List.Section>
      )}
      <List.Section title="Alle Prompts">
        {rest.map(p => <PromptItem key={p.id} prompt={p} onCopy={copyAndTrack} onPreview={setSelected} />)}
      </List.Section>
    </List>
  );
}

function PromptItem({ prompt, onCopy, onPreview }: {
  prompt: Prompt;
  onCopy: (p: Prompt) => void;
  onPreview: (p: Prompt) => void;
}) {
  return (
    <List.Item
      icon={CAT_EMOJI[prompt.category] ?? "📝"}
      title={prompt.name}
      subtitle={prompt.content.slice(0, 60) + "…"}
      accessories={[
        { tag: prompt.model.split("-").slice(1, 3).join("-") },
        ...(prompt.usageCount > 0 ? [{ text: `×${prompt.usageCount}` }] : []),
      ]}
      actions={
        <ActionPanel>
          <Action title="Kopieren" icon="📋" onAction={() => onCopy(prompt)} />
          <Action title="Vorschau" icon="👁" onAction={() => onPreview(prompt)} />
        </ActionPanel>
      }
    />
  );
}
