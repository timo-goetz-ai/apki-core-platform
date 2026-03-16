"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", letterSpacing: "-0.01em" }}>
            Automation + KI
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#0f172a" : "#64748b",
                  textDecoration: "none",
                  background: active ? "#f1f5f9" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {currentTime && (
            <span style={{ fontSize: 12, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
              {currentTime}
            </span>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            fontSize: 12, fontWeight: 500,
            background: healthy ? "#f0fdf4" : "#fefce8",
            color: healthy ? "#16a34a" : "#ca8a04",
            border: `1px solid ${healthy ? "#bbf7d0" : "#fde68a"}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: healthy ? "#16a34a" : "#ca8a04",
              animation: healthy ? "topbar-pulse 2s infinite" : "none",
            }} />
            Production
          </div>
        </div>
      </div>

      <style>{`
        @keyframes topbar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.header>
  );
}
