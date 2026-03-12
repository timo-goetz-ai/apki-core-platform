import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIOS Admin Dashboard",
  description: "Central control panel for the AI Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#0a0f1a] text-slate-100">{children}</body>
    </html>
  );
}
