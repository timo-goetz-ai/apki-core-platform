import type { Metadata } from 'next';
import './globals.css';
import { LLMProvider } from '@/lib/llm-context';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';

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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="min-h-screen"
        style={{ background: 'var(--layer-0)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
      >
        <LLMProvider>
          {/* Fixed sidebar */}
          <AppSidebar />

          {/* Fixed top header (starts after sidebar) */}
          <AppHeader />

          {/* Main content area */}
          <main
            className="min-h-screen"
            style={{ paddingLeft: '220px', paddingTop: '60px' }}
          >
            {children}
          </main>
        </LLMProvider>
      </body>
    </html>
  );
}
