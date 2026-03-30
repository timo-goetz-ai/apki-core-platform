"use client";

import { useEffect, useRef, useState } from "react";
import { dashboardApiAuthHeaders } from "@/lib/dashboard-auth-headers";

const SSE_RECONNECT_MAX = 12;
const SSE_RECONNECT_MS = 2500;
const POLL_MS = 3000;

export function useCrewStream(executionId: string | null) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pollTick, setPollTick] = useState(0);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!executionId) return;

    setEvents([]);
    setIsConnected(false);
    attemptRef.current = 0;

    let cancelled = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (cancelled) return;
      es?.close();
      const url = `/api/crews/stream/${encodeURIComponent(executionId)}`;
      es = new EventSource(url);

      es.onopen = () => {
        if (cancelled) return;
        setIsConnected(true);
        attemptRef.current = 0;
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as Record<string, unknown>;
          setEvents((prev) => [...prev, data]);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setIsConnected(false);
        es?.close();
        attemptRef.current += 1;
        if (attemptRef.current <= SSE_RECONNECT_MAX) {
          reconnectTimer = setTimeout(connect, SSE_RECONNECT_MS);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [executionId]);

  useEffect(() => {
    if (!executionId || isConnected) return;

    const id = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/crews/executions/${encodeURIComponent(executionId)}/status`,
          { headers: { ...dashboardApiAuthHeaders() } }
        );
        if (r.ok) {
          setPollTick((t) => t + 1);
        }
      } catch {
        // ignore
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [executionId, isConnected]);

  return { events, isConnected, pollTick };
}
