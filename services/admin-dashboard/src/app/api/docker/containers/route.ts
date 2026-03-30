import { NextRequest, NextResponse } from "next/server";
import http from "http";
import { unauthorizedResponse, verifyApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DOCKER_HOST = process.env.DOCKER_HOST ?? "unix:///var/run/docker.sock";

function dockerRequest(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const isUnix = DOCKER_HOST.startsWith("unix://");
    const socketPath = isUnix ? DOCKER_HOST.replace("unix://", "") : undefined;
    const tcpHost = !isUnix ? DOCKER_HOST.replace("tcp://", "").split(":")[0] : undefined;
    const tcpPort = !isUnix ? parseInt(DOCKER_HOST.split(":").pop() ?? "2375") : undefined;

    const options: http.RequestOptions = isUnix
      ? { socketPath, path, method: "GET", headers: { Host: "localhost" } }
      : { hostname: tcpHost, port: tcpPort, path, method: "GET" };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON from Docker"));
        }
      });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Docker timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  try {
    const containers = await dockerRequest("/containers/json?all=1");
    return NextResponse.json({ containers });
  } catch (e) {
    return NextResponse.json({ error: String(e), containers: [] }, { status: 503 });
  }
}
