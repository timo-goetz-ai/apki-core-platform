import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";
import http from "http";

export const dynamic = "force-dynamic";

const DOCKER_HOST = process.env.DOCKER_HOST ?? "unix:///var/run/docker.sock";

function dockerPost(path: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    const isUnix = DOCKER_HOST.startsWith("unix://");
    const socketPath = isUnix ? DOCKER_HOST.replace("unix://", "") : undefined;
    const tcpHost = !isUnix ? DOCKER_HOST.replace("tcp://", "").split(":")[0] : undefined;
    const tcpPort = !isUnix ? parseInt(DOCKER_HOST.split(":").pop() ?? "2375") : undefined;

    const options: http.RequestOptions = isUnix
      ? { socketPath, path, method: "POST", headers: { Host: "localhost", "Content-Length": "0" } }
      : { hostname: tcpHost, port: tcpPort, path, method: "POST", headers: { "Content-Length": "0" } };

    const req = http.request(options, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode ?? 200 }));
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Docker timeout")); });
    req.on("error", reject);
    req.end();
  });
}

const ALLOWED_ACTIONS = new Set(["start", "stop", "restart"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const { id, action } = await params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  }

  try {
    const result = await dockerPost(`/containers/${id}/${action}`);
    return NextResponse.json({ ok: result.status < 300, status: result.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
