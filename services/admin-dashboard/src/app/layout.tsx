import type { Metadata } from 'next';
import './globals.css';
import { LLMProvider } from '@/lib/llm-context';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'AIOS Admin',
  description: 'Zentrale Steuereinheit für KI-Agents, Workflows und Infrastruktur auf automation-plus-ki.de',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('theme');
              var dark = t==='dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) || t!=='light';
              document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            }catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="min-h-screen"
        style={{ background: 'var(--layer-0)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
      >
        <LLMProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </LLMProvider>
      </body>
    </html>
  );
}
