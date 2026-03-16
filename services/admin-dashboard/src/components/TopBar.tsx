"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  apiStatus?: string;
  currentTime?: string;
}

const NAV = [
  { label: "Overview",  href: "/" },
  { label: "Services",  href: "/services" },
  { label: "API",       href: "/api-docs" },
  { label: "Metrics",   href: "/metrics" },
];

export default function TopBar({ apiStatus, currentTime }: TopBarProps) {
  const pathname = usePathname();
  const healthy = apiStatus === "healthy";
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: isDark ? "rgba(43,45,49,0.88)" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        transition: "background 0.25s, border-color 0.25s",
      }}
    >
      <div style={{
        maxWidth: 1440, margin: "0 auto", padding: "0 24px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: "#5B7FA8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={13} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: isDark ? "#E8E8EC" : "#18181B", letterSpacing: "-0.01em" }}>
            Automation + KI
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "5px 11px", borderRadius: 6, fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active
                    ? (isDark ? "#E8E8EC" : "#18181B")
                    : (isDark ? "#6B6E75" : "#71717A"),
                  textDecoration: "none",
                  background: active
                    ? (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)")
                    : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {currentTime && (
            <span style={{
              fontSize: 12, fontVariantNumeric: "tabular-nums",
              fontFamily: "JetBrains Mono, monospace",
              color: isDark ? "#6B6E75" : "#A1A1AA",
            }}>
              {currentTime}
            </span>
          )}

          {/* Status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 20,
            fontSize: 11, fontWeight: 500,
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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6, cursor: "pointer",
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              color: isDark ? "#A0A0A8" : "#71717A",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"; }}
          >
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
