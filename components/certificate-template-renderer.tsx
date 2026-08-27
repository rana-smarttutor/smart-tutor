"use client";

import React from "react";
import type { CertificateTemplateId } from "@/lib/types";
import { getTemplateConfig } from "@/lib/certificate-templates";

type Props = {
  certificate: {
    recipientName: string;
    title: string;
    description: string;
    courseName?: string;
    issuedDate: string;
    issuedByName: string;
    certificateNo: string;
    templateId: CertificateTemplateId;
  };
  compact?: boolean;
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ───────────────────────────────────────────
   CLASSIC GOLD
   ─────────────────────────────────────────── */

function ClassicGold({
  cert,
  compact,
}: {
  cert: Props["certificate"];
  compact?: boolean;
}) {
  const fs = (full: string, sm: string) => (compact ? sm : full);

  return (
    <div
      style={{
        width: compact ? 300 : "100%",
        aspectRatio: compact ? "3/2" : "1.42 / 1",
        background:
          "linear-gradient(160deg, #fffbeb 0%, #fef3c7 40%, #fde68a 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Outer double-line gold border */}
      <div
        style={{
          position: "absolute",
          inset: compact ? 4 : 10,
          border: `${compact ? 1.5 : 3}px solid #d4a843`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: compact ? 8 : 18,
          border: `${compact ? 0.75 : 1.5}px solid #d4a843`,
          pointerEvents: "none",
        }}
      />

      {/* Corner ornaments */}
      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map(
        (pos) => {
          const isTop = pos.includes("top");
          const isLeft = pos.includes("left");
          const sz = compact ? 14 : 30;
          return (
            <div
              key={pos}
              style={{
                position: "absolute",
                top: isTop ? (compact ? 6 : 14) : undefined,
                bottom: !isTop ? (compact ? 6 : 14) : undefined,
                left: isLeft ? (compact ? 6 : 14) : undefined,
                right: !isLeft ? (compact ? 6 : 14) : undefined,
                width: sz,
                height: sz,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: sz,
                  height: sz,
                  borderTop: `${compact ? 1 : 2}px solid #b8860b`,
                  borderLeft: `${compact ? 1 : 2}px solid #b8860b`,
                  transformOrigin: "top left",
                  transform: `rotate(${isTop && !isLeft ? 90 : !isTop && isLeft ? 270 : !isTop && !isLeft ? 180 : 0}deg)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: compact ? 3 : 6,
                  left: compact ? 3 : 6,
                  width: compact ? 5 : 12,
                  height: compact ? 5 : 12,
                  borderTop: `${compact ? 0.5 : 1}px solid #c9963c`,
                  borderLeft: `${compact ? 0.5 : 1}px solid #c9963c`,
                  transformOrigin: "top left",
                  transform: `rotate(${isTop && !isLeft ? 90 : !isTop && isLeft ? 270 : !isTop && !isLeft ? 180 : 0}deg)`,
                }}
              />
            </div>
          );
        },
      )}

      {/* Content container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: compact ? "12px 14px 8px" : "28px 40px 18px",
        }}
      >
        {/* TOP ROW: Logo left, Cert No right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: compact ? 2 : 6,
          }}
        >
          {/* Logo + Institute */}
          <div
            style={{ display: "flex", alignItems: "center", gap: compact ? 3 : 8 }}
          >
            <div
              style={{
                width: compact ? 18 : 40,
                height: compact ? 18 : 40,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #f5d47a 0%, #d4a843 60%, #b8860b 100%)",
                boxShadow: `0 0 ${compact ? 3 : 8}px rgba(184,134,11,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: fs("14px", "7px"),
                  fontWeight: "bold",
                  color: "#7c5e1c",
                  fontFamily: "'Georgia', serif",
                }}
              >
                ST
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: fs("9px", "5px"),
                  fontWeight: "bold",
                  color: "#8b7230",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                Smart IQ Institute
              </div>
              <div
                style={{
                  fontSize: fs("7px", "3.5px"),
                  color: "#a0874a",
                  letterSpacing: "0.08em",
                }}
              >
                Vashi, Navi Mumbai
              </div>
            </div>
          </div>

          {/* Certificate Number */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#a0874a",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 1,
              }}
            >
              Certificate No.
            </div>
            <div
              style={{
                fontSize: fs("9px", "5px"),
                color: "#7c5e1c",
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              {cert.certificateNo}
            </div>
          </div>
        </div>

        {/* Gold divider line */}
        <div
          style={{
            width: "100%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #d4a843, transparent)",
            marginBottom: compact ? 2 : 8,
          }}
        />

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("22px", "10px"),
              fontWeight: "bold",
              color: "#8b6914",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {cert.title}
          </div>
          <div
            style={{
              fontSize: fs("8px", "4px"),
              color: "#a0874a",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginTop: compact ? 1 : 3,
            }}
          >
            This certificate is proudly presented to
          </div>
        </div>

        {/* Recipient name */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("30px", "13px"),
              fontStyle: "italic",
              color: "#7c5e1c",
              fontWeight: "bold",
              lineHeight: 1.1,
              borderBottom: `${compact ? 0.5 : 1.5}px solid #d4a843`,
              paddingBottom: compact ? 1 : 4,
              display: "inline-block",
              maxWidth: "80%",
            }}
          >
            {cert.recipientName}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: fs("10px", "5px"),
            color: "#8b7230",
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: "88%",
            marginBottom: compact ? 1 : 4,
            alignSelf: "center",
          }}
        >
          {cert.description}
        </div>

        {/* Course name */}
        {cert.courseName && (
          <div
            style={{
              textAlign: "center",
              fontSize: fs("10px", "5px"),
              color: "#9c7e3a",
              fontWeight: "bold",
              fontStyle: "italic",
              marginBottom: compact ? 1 : 4,
            }}
          >
            Course: {cert.courseName}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #d4a843, transparent)",
            marginBottom: compact ? 2 : 6,
          }}
        />

        {/* BOTTOM ROW: Date | Signature | Seal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Date */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 50 : 110,
                borderBottom: `${compact ? 0.5 : 1}px solid #b8860b`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("7px", "3.5px"),
                color: "#a0874a",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Date of Issue
            </div>
            <div
              style={{
                fontSize: fs("9px", "4.5px"),
                color: "#7c5e1c",
                fontWeight: "bold",
              }}
            >
              {formatDate(cert.issuedDate)}
            </div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                fontSize: fs("16px", "7px"),
                fontStyle: "italic",
                color: "#5a4520",
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                lineHeight: 1,
                marginBottom: compact ? 0 : 2,
              }}
            >
              {cert.issuedByName.split(" ")[0]}
            </div>
            <div
              style={{
                width: compact ? 50 : 110,
                borderBottom: `${compact ? 0.5 : 1}px solid #b8860b`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("8px", "4px"),
                color: "#7c5e1c",
                fontWeight: "bold",
              }}
            >
              {cert.issuedByName}
            </div>
            <div
              style={{ fontSize: fs("7px", "3.5px"), color: "#a0874a" }}
            >
              Director, Smart IQ Institute
            </div>
          </div>

          {/* Seal */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 22 : 46,
                height: compact ? 22 : 46,
                borderRadius: "50%",
                border: `${compact ? 0.5 : 1.5}px dashed #c9963c`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: compact ? 1 : 3,
              }}
            >
              <div
                style={{
                  fontSize: fs("6px", "3px"),
                  color: "#a0874a",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontWeight: "bold",
                }}
              >
                ST
                <br />
                SEAL
              </div>
            </div>
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#a0874a",
                letterSpacing: "0.08em",
              }}
            >
              AUTHORIZED SEAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   MODERN BLUE
   ─────────────────────────────────────────── */

function ModernBlue({
  cert,
  compact,
}: {
  cert: Props["certificate"];
  compact?: boolean;
}) {
  const fs = (full: string, sm: string) => (compact ? sm : full);

  return (
    <div
      style={{
        width: compact ? 300 : "100%",
        aspectRatio: compact ? "3/2" : "1.42 / 1",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: compact ? 14 : 40,
          background:
            "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
        }}
      />

      {/* Bottom gradient bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: compact ? 5 : 14,
          background:
            "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
        }}
      />

      {/* Corner decorations */}
      {[
        {
          top: compact ? 16 : 46,
          left: compact ? 6 : 18,
          bt: "top",
          bl: "left",
        },
        {
          top: compact ? 16 : 46,
          right: compact ? 6 : 18,
          bt: "top",
          br: "right",
        },
        {
          bottom: compact ? 6 : 16,
          left: compact ? 6 : 18,
          bb: "bottom",
          bl: "left",
        },
        {
          bottom: compact ? 6 : 16,
          right: compact ? 6 : 18,
          bb: "bottom",
          br: "right",
        },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: "left" in c ? c.left : undefined,
            right: "right" in c ? c.right : undefined,
            bottom: "bottom" in c ? c.bottom : undefined,
            width: compact ? 12 : 30,
            height: compact ? 12 : 30,
            borderTop: "bt" in c
              ? `${compact ? 1.5 : 2.5}px solid #3b82f6`
              : undefined,
            borderBottom: "bb" in c
              ? `${compact ? 1.5 : 2.5}px solid #3b82f6`
              : undefined,
            borderLeft: "bl" in c
              ? `${compact ? 1.5 : 2.5}px solid #3b82f6`
              : undefined,
            borderRight: "br" in c
              ? `${compact ? 1.5 : 2.5}px solid #3b82f6`
              : undefined,
          }}
        />
      ))}

      {/* Side accent lines */}
      <div
        style={{
          position: "absolute",
          top: compact ? 20 : 52,
          bottom: compact ? 10 : 22,
          left: compact ? 5 : 14,
          width: compact ? 1 : 2,
          background: "linear-gradient(180deg, #3b82f6, #93c5fd, #3b82f6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: compact ? 20 : 52,
          bottom: compact ? 10 : 22,
          right: compact ? 5 : 14,
          width: compact ? 1 : 2,
          background: "linear-gradient(180deg, #3b82f6, #93c5fd, #3b82f6)",
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: compact ? "18px 14px 8px" : "48px 40px 18px",
        }}
      >
        {/* TOP ROW: Logo left, Cert No right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: compact ? 2 : 6,
          }}
        >
          {/* Logo + Institute */}
          <div
            style={{ display: "flex", alignItems: "center", gap: compact ? 3 : 8 }}
          >
            <div
              style={{
                width: compact ? 16 : 36,
                height: compact ? 16 : 36,
                borderRadius: compact ? 3 : 6,
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: fs("13px", "7px"),
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                ST
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: fs("9px", "5px"),
                  fontWeight: 700,
                  color: "#1e40af",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                Smart IQ Institute
              </div>
              <div
                style={{
                  fontSize: fs("7px", "3.5px"),
                  color: "#6b7280",
                  letterSpacing: "0.05em",
                }}
              >
                Vashi, Navi Mumbai
              </div>
            </div>
          </div>

          {/* Cert number badge */}
          <div
            style={{
              textAlign: "right",
              background: "#eff6ff",
              border: `${compact ? 0.5 : 1}px solid #bfdbfe`,
              borderRadius: compact ? 2 : 4,
              padding: compact ? "2px 4px" : "4px 10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#6b7280",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Certificate No.
            </div>
            <div
              style={{
                fontSize: fs("9px", "5px"),
                color: "#1d4ed8",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {cert.certificateNo}
            </div>
          </div>
        </div>

        {/* Blue divider */}
        <div
          style={{
            width: "100%",
            height: compact ? 1 : 2,
            background: "linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)",
            marginBottom: compact ? 2 : 8,
          }}
        />

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("22px", "10px"),
              fontWeight: 800,
              color: "#1d4ed8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {cert.title}
          </div>
          <div
            style={{
              fontSize: fs("8px", "4px"),
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginTop: compact ? 1 : 3,
            }}
          >
            Presented to
          </div>
        </div>

        {/* Recipient name */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("28px", "12px"),
              fontWeight: 800,
              color: "#1e40af",
              lineHeight: 1.1,
              paddingBottom: compact ? 1 : 4,
              borderBottom: `${compact ? 0.5 : 1.5}px solid #bfdbfe`,
              display: "inline-block",
            }}
          >
            {cert.recipientName}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: fs("10px", "5px"),
            color: "#6b7280",
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: "88%",
            marginBottom: compact ? 1 : 4,
            alignSelf: "center",
          }}
        >
          {cert.description}
        </div>

        {/* Course */}
        {cert.courseName && (
          <div
            style={{
              display: "inline-block",
              fontSize: fs("9px", "4.5px"),
              color: "#1d4ed8",
              fontWeight: 600,
              background: "#eff6ff",
              border: `${compact ? 0.5 : 1}px solid #bfdbfe`,
              borderRadius: compact ? 2 : 6,
              padding: compact ? "1px 5px" : "3px 14px",
              marginBottom: compact ? 1 : 4,
              alignSelf: "center",
            }}
          >
            {cert.courseName}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom divider */}
        <div
          style={{
            width: "100%",
            height: compact ? 0.5 : 1,
            background: "#e5e7eb",
            marginBottom: compact ? 2 : 6,
          }}
        />

        {/* BOTTOM ROW: Date | Signature | Seal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Date */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 48 : 100,
                borderBottom: `${compact ? 0.5 : 1.5}px solid #3b82f6`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("7px", "3.5px"),
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Date of Issue
            </div>
            <div
              style={{
                fontSize: fs("9px", "4.5px"),
                color: "#1e40af",
                fontWeight: 600,
              }}
            >
              {formatDate(cert.issuedDate)}
            </div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                fontSize: fs("16px", "7px"),
                fontStyle: "italic",
                color: "#1e40af",
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                lineHeight: 1,
                marginBottom: compact ? 0 : 2,
              }}
            >
              {cert.issuedByName.split(" ")[0]}
            </div>
            <div
              style={{
                width: compact ? 48 : 100,
                borderBottom: `${compact ? 0.5 : 1.5}px solid #3b82f6`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("8px", "4px"),
                color: "#1e40af",
                fontWeight: 600,
              }}
            >
              {cert.issuedByName}
            </div>
            <div
              style={{ fontSize: fs("7px", "3.5px"), color: "#9ca3af" }}
            >
              Director, Smart IQ Institute
            </div>
          </div>

          {/* Seal */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 22 : 44,
                height: compact ? 22 : 44,
                borderRadius: "50%",
                border: `${compact ? 0.5 : 1.5}px dashed #3b82f6`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: compact ? 1 : 3,
              }}
            >
              <div
                style={{
                  fontSize: fs("6px", "3px"),
                  color: "#3b82f6",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                ST
                <br />
                SEAL
              </div>
            </div>
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#9ca3af",
                letterSpacing: "0.05em",
              }}
            >
              AUTHORIZED SEAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   PROFESSIONAL DARK
   ─────────────────────────────────────────── */

function ProfessionalDark({
  cert,
  compact,
}: {
  cert: Props["certificate"];
  compact?: boolean;
}) {
  const fs = (full: string, sm: string) => (compact ? sm : full);

  return (
    <div
      style={{
        width: compact ? 300 : "100%",
        aspectRatio: compact ? "3/2" : "1.42 / 1",
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #334155 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Silver border outer */}
      <div
        style={{
          position: "absolute",
          inset: compact ? 4 : 10,
          border: `${compact ? 1 : 2}px solid rgba(148,163,184,0.5)`,
          pointerEvents: "none",
        }}
      />
      {/* Silver border inner */}
      <div
        style={{
          position: "absolute",
          inset: compact ? 7 : 16,
          border: `${compact ? 0.5 : 1}px solid rgba(148,163,184,0.25)`,
          pointerEvents: "none",
        }}
      />

      {/* Diamond decorations top */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: compact ? 8 : 22,
            left: `${pos * 100}%`,
            transform: "translateX(-50%) rotate(45deg)",
            width: compact ? 4 : 9,
            height: compact ? 4 : 9,
            background:
              i === 2
                ? "linear-gradient(135deg, #e2e8f0, #f8fafc)"
                : "linear-gradient(135deg, #64748b, #94a3b8)",
            boxShadow: `0 0 ${compact ? 2 : 5}px rgba(148,163,184,0.3)`,
          }}
        />
      ))}

      {/* Diamond decorations bottom */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos, i) => (
        <div
          key={`b-${i}`}
          style={{
            position: "absolute",
            bottom: compact ? 8 : 22,
            left: `${pos * 100}%`,
            transform: "translateX(-50%) rotate(45deg)",
            width: compact ? 4 : 9,
            height: compact ? 4 : 9,
            background:
              i === 2
                ? "linear-gradient(135deg, #e2e8f0, #f8fafc)"
                : "linear-gradient(135deg, #64748b, #94a3b8)",
            boxShadow: `0 0 ${compact ? 2 : 5}px rgba(148,163,184,0.3)`,
          }}
        />
      ))}

      {/* Left diamond accents */}
      {[0.3, 0.5, 0.7].map((pos, i) => (
        <div
          key={`l-${i}`}
          style={{
            position: "absolute",
            left: compact ? 8 : 22,
            top: `${pos * 100}%`,
            transform: "translateY(-50%) rotate(45deg)",
            width: compact ? 3 : 7,
            height: compact ? 3 : 7,
            background:
              i === 1
                ? "linear-gradient(135deg, #e2e8f0, #f8fafc)"
                : "linear-gradient(135deg, #64748b, #94a3b8)",
            boxShadow: `0 0 ${compact ? 2 : 4}px rgba(148,163,184,0.2)`,
          }}
        />
      ))}

      {/* Right diamond accents */}
      {[0.3, 0.5, 0.7].map((pos, i) => (
        <div
          key={`r-${i}`}
          style={{
            position: "absolute",
            right: compact ? 8 : 22,
            top: `${pos * 100}%`,
            transform: "translateY(-50%) rotate(45deg)",
            width: compact ? 3 : 7,
            height: compact ? 3 : 7,
            background:
              i === 1
                ? "linear-gradient(135deg, #e2e8f0, #f8fafc)"
                : "linear-gradient(135deg, #64748b, #94a3b8)",
            boxShadow: `0 0 ${compact ? 2 : 4}px rgba(148,163,184,0.2)`,
          }}
        />
      ))}

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: compact ? 120 : 500,
          height: compact ? 80 : 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(100,116,139,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: compact ? "16px 14px 8px" : "38px 40px 18px",
        }}
      >
        {/* TOP ROW: Logo left, Cert No right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: compact ? 2 : 6,
          }}
        >
          {/* Logo + Institute */}
          <div
            style={{ display: "flex", alignItems: "center", gap: compact ? 3 : 8 }}
          >
            <div
              style={{
                width: compact ? 16 : 36,
                height: compact ? 16 : 36,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #475569, #94a3b8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 0 ${compact ? 3 : 8}px rgba(148,163,184,0.3)`,
              }}
            >
              <span
                style={{
                  fontSize: fs("12px", "6px"),
                  fontWeight: 800,
                  color: "#f8fafc",
                }}
              >
                ST
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: fs("9px", "5px"),
                  fontWeight: 600,
                  color: "#e2e8f0",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                Smart IQ Institute
              </div>
              <div
                style={{
                  fontSize: fs("7px", "3.5px"),
                  color: "#64748b",
                  letterSpacing: "0.08em",
                }}
              >
                Vashi, Navi Mumbai
              </div>
            </div>
          </div>

          {/* Cert number badge */}
          <div
            style={{
              textAlign: "right",
              background: "rgba(100,116,139,0.2)",
              border: `${compact ? 0.5 : 1}px solid rgba(148,163,184,0.3)`,
              borderRadius: compact ? 2 : 4,
              padding: compact ? "2px 4px" : "4px 10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Certificate No.
            </div>
            <div
              style={{
                fontSize: fs("9px", "5px"),
                color: "#cbd5e1",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {cert.certificateNo}
            </div>
          </div>
        </div>

        {/* Silver divider */}
        <div
          style={{
            width: "100%",
            height: compact ? 0.5 : 1,
            background:
              "linear-gradient(90deg, transparent, #64748b, transparent)",
            marginBottom: compact ? 2 : 8,
          }}
        />

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("22px", "10px"),
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {cert.title}
          </div>

          {/* Diamond separator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: compact ? 3 : 8,
              marginTop: compact ? 1 : 4,
              marginBottom: compact ? 1 : 4,
            }}
          >
            <div
              style={{
                width: compact ? 16 : 40,
                height: 1,
                background: "linear-gradient(90deg, transparent, #64748b)",
              }}
            />
            <div
              style={{
                width: compact ? 3 : 6,
                height: compact ? 3 : 6,
                transform: "rotate(45deg)",
                background: "linear-gradient(135deg, #94a3b8, #e2e8f0)",
              }}
            />
            <div
              style={{
                width: compact ? 16 : 40,
                height: 1,
                background: "linear-gradient(90deg, #64748b, transparent)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: fs("8px", "4px"),
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            Proudly presented to
          </div>
        </div>

        {/* Recipient name */}
        <div style={{ textAlign: "center", marginBottom: compact ? 1 : 4 }}>
          <div
            style={{
              fontSize: fs("30px", "13px"),
              fontWeight: 800,
              color: "#f8fafc",
              lineHeight: 1.1,
              textShadow: `0 0 ${compact ? 6 : 20}px rgba(148,163,184,0.3)`,
              paddingBottom: compact ? 1 : 4,
              borderBottom: `${compact ? 0.5 : 1}px solid rgba(148,163,184,0.4)`,
              display: "inline-block",
            }}
          >
            {cert.recipientName}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: fs("10px", "5px"),
            color: "#cbd5e1",
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: "88%",
            marginBottom: compact ? 1 : 4,
            alignSelf: "center",
          }}
        >
          {cert.description}
        </div>

        {/* Course */}
        {cert.courseName && (
          <div
            style={{
              fontSize: fs("9px", "4.5px"),
              color: "#e2e8f0",
              fontWeight: 600,
              letterSpacing: "0.05em",
              marginBottom: compact ? 1 : 4,
              textAlign: "center",
            }}
          >
            {cert.courseName}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom divider */}
        <div
          style={{
            width: "100%",
            height: compact ? 0.5 : 1,
            background: "linear-gradient(90deg, transparent, #475569, transparent)",
            marginBottom: compact ? 2 : 6,
          }}
        />

        {/* BOTTOM ROW: Date | Signature | Seal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Date */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 48 : 100,
                borderBottom: `${compact ? 0.5 : 1}px solid #475569`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("7px", "3.5px"),
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Date of Issue
            </div>
            <div
              style={{
                fontSize: fs("9px", "4.5px"),
                color: "#e2e8f0",
                fontWeight: 600,
              }}
            >
              {formatDate(cert.issuedDate)}
            </div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                fontSize: fs("16px", "7px"),
                fontStyle: "italic",
                color: "#e2e8f0",
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                lineHeight: 1,
                marginBottom: compact ? 0 : 2,
              }}
            >
              {cert.issuedByName.split(" ")[0]}
            </div>
            <div
              style={{
                width: compact ? 48 : 100,
                borderBottom: `${compact ? 0.5 : 1}px solid #475569`,
                marginBottom: compact ? 1 : 3,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            />
            <div
              style={{
                fontSize: fs("8px", "4px"),
                color: "#f1f5f9",
                fontWeight: 600,
              }}
            >
              {cert.issuedByName}
            </div>
            <div
              style={{ fontSize: fs("7px", "3.5px"), color: "#64748b" }}
            >
              Director, Smart IQ Institute
            </div>
          </div>

          {/* Seal */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                width: compact ? 22 : 44,
                height: compact ? 22 : 44,
                borderRadius: "50%",
                border: `${compact ? 0.5 : 1.5}px dashed rgba(148,163,184,0.5)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: compact ? 1 : 3,
              }}
            >
              <div
                style={{
                  fontSize: fs("6px", "3px"),
                  color: "#94a3b8",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                ST
                <br />
                SEAL
              </div>
            </div>
            <div
              style={{
                fontSize: fs("6px", "3px"),
                color: "#475569",
                letterSpacing: "0.08em",
              }}
            >
              AUTHORIZED SEAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────── */

export function CertificateTemplateRenderer({ certificate, compact }: Props) {
  const wrapperStyle: React.CSSProperties = compact
    ? {
        display: "inline-block",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }
    : {
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      };

  return (
    <div style={wrapperStyle} data-certificate-renderer>
      {certificate.templateId === "classic-gold" && (
        <ClassicGold cert={certificate} compact={compact} />
      )}
      {certificate.templateId === "modern-blue" && (
        <ModernBlue cert={certificate} compact={compact} />
      )}
      {certificate.templateId === "professional-dark" && (
        <ProfessionalDark cert={certificate} compact={compact} />
      )}
    </div>
  );
}

export default CertificateTemplateRenderer;
