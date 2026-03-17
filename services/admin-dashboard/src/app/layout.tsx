import type { Metadata } from 'next';
import './globals.css';
import { LLMProvider } from '@/lib/llm-context';
import TopBar from '@/components/TopBar';
import ModelBar from '@/components/ModelBar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'AIOS Admin',
  description:
    'Zentrale Steuereinheit für KI-Agents, Workflows und Infrastruktur auf automation-plus-ki.de',
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
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <LLMProvider>
          <TopBar />
          <ModelBar />
          <Sidebar />
          <main
            className="min-h-screen"
            style={{ paddingTop: '90px', paddingLeft: '240px' }}
          >
            {children}
          </main>
        </LLMProvider>
      </body>
    </html>
  );
}
