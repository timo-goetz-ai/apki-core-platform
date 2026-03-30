"use client";

import { useEffect, useState } from "react";

export function useCrewStream(executionId: string | null) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!executionId) return;

    const url = `/api/crews/stream/${executionId}`;
    const es = new EventSource(url);

    es.onopen = () => setIsConnected(true);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        setEvents((prev) => [...prev, data]);
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => setIsConnected(false);

    return () => es.close();
  }, [executionId]);

  return { events, isConnected };
}
