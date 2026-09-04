"use client";

import { useEffect, useState } from "react";

export function LoadingScreen({ message }: { message?: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.logoWrapper}>
          <img src="/Smart-institue-logo.jpeg" alt="SmartIQ Institute" style={styles.logo} />
        </div>
        <div style={styles.dotsRow}>
          <span style={{ ...styles.dot, animationDelay: "0s" }} />
          <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
          <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
        </div>
        <p style={styles.text}>{message || `Loading${dots}`}</p>
      </div>
      <style>{`
        @keyframes ld-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ld-fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%)",
    zIndex: 9999,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    animation: "ld-fadeUp 0.5s ease-out",
  },
  logoWrapper: {
    width: "100px",
    height: "100px",
    borderRadius: "24px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 8px 32px rgba(79, 70, 229, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: "72px", height: "72px", objectFit: "contain" },
  dotsRow: { display: "flex", gap: "8px" },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4f46e5",
    animation: "ld-pulse 1.2s ease-in-out infinite",
    display: "inline-block",
  },
  text: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748b",
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "0.02em",
  },
};
