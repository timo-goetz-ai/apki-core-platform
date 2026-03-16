import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automation + KI – Control Center",
  description:
    "Zentrale Steuereinheit für KI-Agents, Workflows und Infrastruktur auf automation-plus-ki.de",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, background: "#06070f" }}>
        {children}
      </body>
    </html>
  );
}
