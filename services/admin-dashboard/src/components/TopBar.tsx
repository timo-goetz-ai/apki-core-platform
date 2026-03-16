"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sun, Moon, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  apiStatus?: string;
  currentTime?: string;
}

const NAV = [
  { label: "Dashboard",     href: "/" },
  { label: "Agentic OS",    href: "/agentic-os" },
  { label: "MCP Platform",  href: "/mcp-plattform" },
  {
    label: "Tools",
    href: "#",
    children: [
      { label: "🎨 Content Factory", href: "/#content-factory" },
      { label: "💬 KI-Chat",         href: "/#ki-chat" },
      { label: "🤖 Agent Crew",      href: "/#crew" },
    ],
  },
];


export default function TopBar({ apiStatus, currentTime }: TopBarProps) {
  const pathname = usePathname();
  const healthy = apiStatus === "healthy";
  const [isDark, setIsDark] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const close = () => setToolsOpen(false);
    if (toolsOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [toolsOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const txt  = isDark ? "#E8E8EC" : "#18181B";
  const muted = isDark ? "#6B6E75" : "#71717A";
  const activeBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const dropBg = isDark ? "#2B2D31" : "#FFFFFF";
  const dropBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: isDark ? "rgba(43,45,49,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      <div style={{
        maxWidth: 1440, margin: "0 auto", padding: "0 24px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: "linear-gradient(135deg, #5B7FA8, #7B9FC8)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={13} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: txt, letterSpacing: "-0.01em" }}>
            Automation + KI
          </span>
          <span style={{ fontSize: 10, color: muted, padding: "1px 6px", background: activeBg, borderRadius: 4, fontWeight: 500 }}>
            OS
          </span>
        </Link>

        {/* Main Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {NAV.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} style={{ position: "relative" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setToolsOpen(o => !o); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 11px", borderRadius: 6, fontSize: 13, fontWeight: 400,
                      color: toolsOpen ? txt : muted,
                      background: toolsOpen ? activeBg : "transparent",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    {item.label}
                    <ChevronDown size={11} style={{ transform: toolsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  {toolsOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 180,
                      background: dropBg, border: `1px solid ${dropBorder}`,
                      borderRadius: 8, padding: 6,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      zIndex: 100,
                    }}>
                      {item.children.map(child => (
                        <a key={child.label} href={child.href}
                          style={{
                            display: "block", padding: "6px 10px", borderRadius: 6,
                            fontSize: 13, color: muted, textDecoration: "none",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = txt; (e.currentTarget as HTMLAnchorElement).style.background = activeBg; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = muted; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                padding: "5px 11px", borderRadius: 6, fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? txt : muted,
                textDecoration: "none",
                background: active ? activeBg : "transparent",
              }}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: time + status + theme */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {currentTime && (
            <span style={{
              fontSize: 12, fontVariantNumeric: "tabular-nums",
              fontFamily: "JetBrains Mono, monospace", color: muted,
            }}>
              {currentTime}
            </span>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500,
            background: healthy
              ? (isDark ? "rgba(76,175,114,0.12)" : "rgba(22,163,74,0.08)")
              : (isDark ? "rgba(232,168,56,0.12)" : "rgba(202,138,4,0.08)"),
            color: healthy
              ? (isDark ? "#4CAF72" : "#16A34A")
              : (isDark ? "#E8A838" : "#CA8A04"),
            border: `1px solid ${healthy
              ? (isDark ? "rgba(76,175,114,0.25)" : "rgba(22,163,74,0.2)")
              : (isDark ? "rgba(232,168,56,0.25)" : "rgba(202,138,4,0.2)")}`,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: healthy ? (isDark ? "#4CAF72" : "#16A34A") : (isDark ? "#E8A838" : "#CA8A04"),
              animation: healthy ? "topbar-pulse 2s infinite" : "none",
            }} />
            Production
          </div>

          <button onClick={toggleTheme} aria-label="Toggle theme" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 6, cursor: "pointer",
            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            color: isDark ? "#A0A0A8" : "#71717A",
          }}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes topbar-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </motion.header>
  );
}
