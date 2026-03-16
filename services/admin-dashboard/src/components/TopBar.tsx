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
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(6,7,15,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #0a84ff 0%, #bf5af2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={15} color="white" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#f5f5f7", letterSpacing: "-0.01em" }}>
            Automation + KI
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#f5f5f7" : "#86868b",
                  textDecoration: "none",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
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
            <span style={{ fontSize: 12, color: "#48484a", fontVariantNumeric: "tabular-nums" }}>
              {currentTime}
            </span>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background: healthy ? "rgba(48,209,88,0.12)" : "rgba(255,214,10,0.12)",
              color: healthy ? "#30d158" : "#ffd60a",
              border: `1px solid ${healthy ? "rgba(48,209,88,0.22)" : "rgba(255,214,10,0.22)"}`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: healthy ? "#30d158" : "#ffd60a",
                flexShrink: 0,
                animation: healthy ? "pulse 2s infinite" : "none",
              }}
            />
            Production
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.header>
  );
}
