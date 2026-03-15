"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Fehler</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-600 font-mono mt-2">ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
