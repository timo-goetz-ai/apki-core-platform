import { getIAM, getCloudResourceManager, getServiceUsage } from "../google-auth.js";

const iam = () => getIAM();
const crm = () => getCloudResourceManager();
const su = () => getServiceUsage();

function projectId(): string {
  const id = process.env.GOOGLE_PROJECT_ID;
  if (!id) throw new Error("GOOGLE_PROJECT_ID not set");
  return id;
}

export interface ServiceAccountInfo {
  email: string;
  name: string;
  displayName: string;
  disabled: boolean;
  uniqueId: string;
}

export async function listServiceAccounts(): Promise<ServiceAccountInfo[]> {
  const res = await iam().projects.serviceAccounts.list({
    name: `projects/${projectId()}`,
  });
  return (res.data.accounts || []).map((a: any) => ({
    email: a.email,
    name: a.name,
    displayName: a.displayName || "",
    disabled: a.disabled || false,
    uniqueId: a.uniqueId,
  }));
}

export async function createServiceAccount(
  accountId: string,
  displayName: string
): Promise<ServiceAccountInfo> {
  const res = await iam().projects.serviceAccounts.create({
    name: `projects/${projectId()}`,
    requestBody: {
      accountId,
      serviceAccount: { displayName },
    },
  });
  return {
    email: res.data.email!,
    name: res.data.name!,
    displayName: res.data.displayName || "",
    disabled: false,
    uniqueId: res.data.uniqueId!,
  };
}

export async function deleteServiceAccount(email: string): Promise<void> {
  await iam().projects.serviceAccounts.delete({
    name: `projects/${projectId()}/serviceAccounts/${email}`,
  });
}

export async function getIAMPolicy(): Promise<{
  bindings: { role: string; members: string[] }[];
}> {
  const res = await crm().projects.getIamPolicy({
    resource: projectId(),
    requestBody: {},
  });
  return {
    bindings: (res.data.bindings || []).map((b: any) => ({
      role: b.role,
      members: b.members || [],
    })),
  };
}

export async function assignRole(
  member: string,
  role: string
): Promise<void> {
  const policy = await crm().projects.getIamPolicy({
    resource: projectId(),
    requestBody: {},
  });

  const bindings = policy.data.bindings || [];
  const existing = bindings.find((b: any) => b.role === role);

  if (existing) {
    if (!existing.members?.includes(member)) {
      existing.members = existing.members || [];
      existing.members.push(member);
    }
  } else {
    bindings.push({ role, members: [member] });
  }

  await crm().projects.setIamPolicy({
    resource: projectId(),
    requestBody: {
      policy: { bindings, etag: policy.data.etag },
    },
  });
}

export async function removeRole(
  member: string,
  role: string
): Promise<void> {
  const policy = await crm().projects.getIamPolicy({
    resource: projectId(),
    requestBody: {},
  });

  const bindings = policy.data.bindings || [];
  const binding = bindings.find((b: any) => b.role === role);

  if (binding && binding.members) {
    binding.members = binding.members.filter((m: string) => m !== member);
    if (binding.members.length === 0) {
      const idx = bindings.indexOf(binding);
      bindings.splice(idx, 1);
    }
  }

  await crm().projects.setIamPolicy({
    resource: projectId(),
    requestBody: {
      policy: { bindings, etag: policy.data.etag },
    },
  });
}

export async function createServiceAccountKey(
  email: string
): Promise<{ keyData: string }> {
  const res = await iam().projects.serviceAccounts.keys.create({
    name: `projects/${projectId()}/serviceAccounts/${email}`,
    requestBody: { keyAlgorithm: "KEY_ALG_RSA_2048" },
  });
  return { keyData: res.data.privateKeyData || "" };
}

export async function listServiceAccountKeys(
  email: string
): Promise<{ name: string; validAfterTime: string; validBeforeTime: string }[]> {
  const res = await iam().projects.serviceAccounts.keys.list({
    name: `projects/${projectId()}/serviceAccounts/${email}`,
  });
  return (res.data.keys || []).map((k: any) => ({
    name: k.name,
    validAfterTime: k.validAfterTime,
    validBeforeTime: k.validBeforeTime,
  }));
}

export async function enableAPI(apiName: string): Promise<string> {
  const res = await su().services.enable({
    name: `projects/${projectId()}/services/${apiName}`,
  });
  return `Enabled ${apiName}: ${res.data.name}`;
}

export async function listEnabledAPIs(): Promise<string[]> {
  const res = await su().services.list({
    parent: `projects/${projectId()}`,
    filter: "state:ENABLED",
    pageSize: 200,
  });
  return (res.data.services || []).map((s: any) => s.config?.name || s.name);
}
