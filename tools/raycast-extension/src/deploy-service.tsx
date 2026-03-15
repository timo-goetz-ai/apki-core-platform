import {
  ActionPanel, Action, List, showToast, Toast,
  getPreferenceValues, Color, Icon,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";

interface Preferences { dashboardUrl: string; apiKey: string; }
interface Service {
  id: string; name: string; kind: string; status: string;
  fqdn: string | null; updatedAt: string | null;
}

const STATUS_COLOR: Record<string, Color> = {
  running: Color.Green,
  stopped: Color.Red,
  starting: Color.Blue,
  error: Color.Red,
  unknown: Color.SecondaryText,
};

export default function DeployService() {
  const prefs = getPreferenceValues<Preferences>();

  const { data, isLoading, revalidate } = useFetch<{ services: Service[] }>(
    `${prefs.dashboardUrl}/api/coolify/services`,
    { headers: { Authorization: `Bearer ${prefs.apiKey}` }, keepPreviousData: true }
  );

  async function deploy(service: Service, force = false) {
    await showToast({ style: Toast.Style.Animated, title: `Deploye ${service.name}…` });
    try {
      const res = await fetch(`${prefs.dashboardUrl}/api/coolify/deploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${prefs.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, force }),
      });
      if (res.ok) {
        await showToast({ style: Toast.Style.Success, title: `${service.name} wird deployt` });
        setTimeout(revalidate, 5000);
      } else {
        throw new Error(`${res.status}`);
      }
    } catch (e) {
      await showToast({ style: Toast.Style.Failure, title: "Deploy fehlgeschlagen", message: String(e) });
    }
  }

  const services = data?.services ?? [];
  const running = services.filter(s => s.status === "running");
  const other   = services.filter(s => s.status !== "running");

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Service suchen…">
      <List.Section title={`${running.length} Online`}>
        {running.map(s => (
          <ServiceItem key={s.id} service={s} statusColor={STATUS_COLOR} onDeploy={deploy} />
        ))}
      </List.Section>
      {other.length > 0 && (
        <List.Section title="Offline / Unbekannt">
          {other.map(s => (
            <ServiceItem key={s.id} service={s} statusColor={STATUS_COLOR} onDeploy={deploy} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function ServiceItem({ service, statusColor, onDeploy }: {
  service: Service;
  statusColor: Record<string, Color>;
  onDeploy: (s: Service, force?: boolean) => void;
}) {
  return (
    <List.Item
      icon={{ source: Icon.Circle, tintColor: statusColor[service.status] ?? Color.SecondaryText }}
      title={service.name}
      subtitle={service.fqdn ?? service.kind}
      accessories={[{ tag: service.status }]}
      actions={
        <ActionPanel>
          <Action title="Deployen" icon={Icon.Upload} onAction={() => onDeploy(service)} />
          <Action title="Force Deploy" icon={Icon.ExclamationMark} onAction={() => onDeploy(service, true)} />
          {service.fqdn && (
            <Action.OpenInBrowser title="Seite öffnen" url={`https://${service.fqdn}`} />
          )}
        </ActionPanel>
      }
    />
  );
}
