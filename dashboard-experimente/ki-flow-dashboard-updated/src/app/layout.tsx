// src/app/layout.tsx
import type { Metadata } from "next";
import { SWRConfig } from "swr";
import "./globals.css";

export const metadata: Metadata = {
  title: "KI-Flow · Infra Dashboard",
  description: "Service health monitoring for KI-Flow infrastructure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        {/* SWR global config — client component needs to be wrapped */}
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}

// Separate client component for SWR provider
// (layout itself stays server component)
import { SWRProvider } from "@/components/SWRProvider";
