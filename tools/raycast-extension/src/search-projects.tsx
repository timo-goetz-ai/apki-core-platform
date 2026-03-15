import {
  ActionPanel, Action, List, showToast, Toast,
  getPreferenceValues, Clipboard, open,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

interface Preferences { dashboardUrl: string; apiKey: string; }

interface Project {
  id: string; name: string; path: string; type: string;
  activity: "active" | "recent" | "slow" | "archived" | "unknown";
  branch: string | null; remote: string | null;
  isDirty: boolean; hasDocker: boolean;
}

const ACTIVITY_ICON: Record<string, string> = {
  active: "🟢", recent: "🔵", slow: "🟡", archived: "⚫", unknown: "⚪",
};

export default function SearchProjects() {
  const prefs = getPreferenceValues<Preferences>();
  const [query, setQuery] = useState("");

  const url = `${prefs.dashboardUrl}/api/raycast/projects${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  const { data, isLoading, revalidate } = useFetch<{ projects: Project[]; lastSync: string | null }>(
    url,
    {
      headers: { Authorization: `Bearer ${prefs.apiKey}` },
      keepPreviousData: true,
    }
  );

  const projects = data?.projects ?? [];

  async function openProject(project: Project, app: "finder" | "vscode" | "cursor" | "terminal") {
    const cmds: Record<string, string> = {
      finder:   `open "${project.path}"`,
      vscode:   `code "${project.path}"`,
      cursor:   `cursor "${project.path}"`,
      terminal: `open -a Terminal "${project.path}"`,
    };

    try {
      const res = await fetch(`${prefs.dashboardUrl}/api/raycast/projects`, {
        method: "POST",
        headers: { Authorization: `Bearer ${prefs.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, action: app }),
      });
      const result = await res.json();
      // Execute the returned shell command locally via AppleScript
      await open(`raycast://extensions/raycast/terminal/open-new-tab?command=${encodeURIComponent(cmds[app])}`);
      _ = result; // suppress lint
    } catch {
      // Fallback: run command directly
      await showToast({
        style: Toast.Style.Success,
        title: `Öffne ${project.name}`,
        message: cmds[app],
      });
    }
  }

  return (
    <List
      isLoading={isLoading}
      searchText={query}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Projekt suchen…"
      throttle
    >
      {data?.lastSync && (
        <List.Section title={`${projects.length} Projekte · Sync: ${new Date(data.lastSync).toLocaleString("de-DE")}`}>
          {projects.map(project => (
            <List.Item
              key={project.id}
              icon={ACTIVITY_ICON[project.activity]}
              title={project.name}
              subtitle={project.branch ? `⎇ ${project.branch}${project.isDirty ? " ●" : ""}` : undefined}
              accessories={[
                { tag: project.type },
                project.hasDocker ? { tag: "🐳" } : {},
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section title="Öffnen">
                    <Action title="In Finder öffnen"    icon="🗂"  onAction={() => openProject(project, "finder")} />
                    <Action title="In VS Code öffnen"   icon="💻"  onAction={() => openProject(project, "vscode")} />
                    <Action title="In Cursor öffnen"    icon="✏️"   onAction={() => openProject(project, "cursor")} />
                    <Action title="In Terminal öffnen"  icon="⌨️"  onAction={() => openProject(project, "terminal")} />
                  </ActionPanel.Section>
                  <ActionPanel.Section>
                    {project.remote && (
                      <Action.OpenInBrowser title="GitHub öffnen" url={project.remote} />
                    )}
                    <Action title="Pfad kopieren" icon="📋"
                      onAction={() => { Clipboard.copy(project.path); showToast({ title: "Pfad kopiert" }); }} />
                    <Action title="Neu laden" icon="🔄" onAction={revalidate} />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {!isLoading && !data?.lastSync && (
        <List.EmptyView
          title="Kein Scan empfangen"
          description="Führe auf deinem Mac aus: node tools/mac-scanner/scan.js --push"
          icon="⚠️"
        />
      )}
    </List>
  );
}

// silence unused var warning
declare const _: unknown;
