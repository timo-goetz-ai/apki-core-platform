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
      {/* Prevent flash: read saved theme before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
