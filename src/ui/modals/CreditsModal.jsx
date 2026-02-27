import { Fragment, useEffect, useRef, useId } from "react";
import { playSFX } from "../../audio/audioManager.js";

export const CREDITS_SECTIONS = [
  {
    category: "Music",
    credit: "AlkaKrab · Creo · Guifrog · Michett",
    items: [
      { label: "Main Menu", entries: [{ title: "Lost Planet (2)", author: "AlkaKrab" }] },
      {
        label: "Combat",
        entries: [
          { title: "Rock Thing",  author: "Creo" },
          { title: "Frog Punch",  author: "Guifrog" },
          { title: "Smackmix",   author: "Michett" },
        ],
      },
    ],
  },
  {
    category: "Sound Effects",
    credit: "Shapeforms Audio",
    items: [{ entries: [{ title: "Shapeforms Audio" }] }],
  },
  {
    category: "3D Models",
    credit: "Quaternius · Mastjie via PolyPizza",
    items: [{ label: "PolyPizza", entries: [{ title: "Quaternius" }, { title: "Mastjie" }] }],
  },
  {
    category: "Icons",
    credit: "game-icons.net",
    items: [{ entries: [{ title: "Game-Icons.net" }] }],
  },
];

// ─── styles ────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(13,11,20,0.88)", zIndex: 55,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    position: "relative",
    width: "min(480px, 92vw)",
    background: "var(--rs-bg-surface)",
    border: "1px solid var(--rs-border)",
    clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
    padding: "28px 28px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: {
    fontFamily: "Bebas Neue, sans-serif",
    fontSize: "2.75rem",
    letterSpacing: "0.15em",
    color: "var(--rs-text)",
    lineHeight: 1,
    margin: 0,
  },
  titleAccent: {
    width: "32px", height: "2px", background: "var(--rs-orange)", marginTop: "6px",
  },
  hr: {
    border: "none", borderTop: "1px solid var(--rs-border)", margin: "0",
  },
  // ThreeJS Journey
  journeyBlock: {
    display: "flex", flexDirection: "column", gap: "3px",
  },
  journeyLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    color: "var(--rs-text-muted)",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  journeyTitle: {
    fontFamily: "Rajdhani, sans-serif",
    fontWeight: 600,
    fontSize: "1rem",
    color: "var(--rs-text)",
  },
  journeyLink: {
    fontFamily: "Rajdhani, sans-serif",
    fontWeight: 400,
    fontSize: "0.9rem",
    color: "var(--rs-teal)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
  },
  // sections
  sectionHeader: {
    fontFamily: "Space Mono, monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
    color: "var(--rs-text-muted)",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  sectionBlock: {
    borderLeft: "2px solid var(--rs-orange)",
    paddingLeft: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "5rem 1fr",
    rowGap: "3px",
    columnGap: "8px",
  },
  cellLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "0.65rem",
    color: "var(--rs-text-dim)",
    paddingTop: "1px",
    whiteSpace: "nowrap",
  },
  cellTitle: {
    fontFamily: "Rajdhani, sans-serif",
    fontWeight: 500,
    fontSize: "0.95rem",
    color: "var(--rs-text)",
  },
  cellAuthor: {
    fontFamily: "Rajdhani, sans-serif",
    fontWeight: 400,
    fontSize: "0.95rem",
    color: "var(--rs-text-muted)",
  },
  // back button
  backBtn: {
    width: "100%",
    padding: "8px 0",
    background: "transparent",
    border: "1px solid var(--rs-border)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text-muted)",
    fontFamily: "Space Mono, monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    outline: "none",
    marginTop: "4px",
  },
};

// ─── component ─────────────────────────────────────────────────────────────

export default function CreditsModal({ onClose }) {
  const titleId = useId();
  const modalRef = useRef(null);
  const backBtnRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const sel = 'button, [href], [tabindex]:not([tabindex="-1"])';
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const nodes = modal.querySelectorAll(sel);
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault(); nodes[nodes.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
        e.preventDefault(); nodes[0].focus();
      }
    };
    modal.addEventListener("keydown", handleTab);
    modal.querySelector(sel)?.focus();
    return () => modal.removeEventListener("keydown", handleTab);
  }, []);

  return (
    <div style={S.overlay} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={modalRef}>
      {/* Modal */}
      <div style={S.modal}>

        {/* Title */}
        <div>
          <h2 id={titleId} style={S.title}>Credits</h2>
          <div style={S.titleAccent} />
        </div>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--rs-text-muted)", textTransform: "uppercase", flexShrink: 0 }}>
            A Game By
          </span>
          <a
            href="https://x.com/Nihdao"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.1rem", letterSpacing: "0.15em", color: "var(--rs-teal)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px", transition: "color 150ms" }}
            onMouseEnter={(e) => { playSFX("button-hover"); e.currentTarget.style.color = "var(--rs-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--rs-teal)"; }}
          >
            NIHDAO
            <span aria-hidden="true" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: 400 }}>↗</span>
          </a>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--rs-text-dim)", textTransform: "uppercase" }}>
            v1.0.0
          </span>
        </div>

        <hr style={S.hr} />

        {/* ThreeJS Journey */}
        <div style={S.journeyBlock}>
          <p style={S.journeyLabel}>Challenge</p>
          <span style={S.journeyTitle}>ThreeJS Journey #022 — Spaceship</span>
          <span style={{ ...S.journeyTitle, fontWeight: 400, fontSize: "0.8rem", color: "var(--rs-text-muted)" }}>
            Course by <span style={{ color: "var(--rs-text)" }}>Bruno Simon</span>
          </span>
          <a
            href="https://threejs-journey.com/challenges/022-spaceship"
            target="_blank"
            rel="noopener noreferrer"
            style={S.journeyLink}
          >
            threejs-journey.com <span aria-hidden="true" style={{ fontSize: "0.75rem" }}>↗</span>
          </a>
        </div>

        <hr style={S.hr} />

        {/* Music */}
        <div style={S.sectionBlock}>
          <p style={S.sectionHeader}>Music</p>
          <div style={S.grid}>
            {CREDITS_SECTIONS[0].items.map((group, gi) =>
              group.entries.map((entry, ei) => (
                <Fragment key={`${gi}-${ei}`}>
                  <span style={S.cellLabel}>
                    {ei === 0 ? group.label : ""}
                  </span>
                  <span style={S.cellTitle}>
                    {entry.title}
                    {entry.author && (
                      <span style={S.cellAuthor}> · {entry.author}</span>
                    )}
                  </span>
                </Fragment>
              ))
            )}
          </div>
        </div>

        {/* SFX + 3D Models — compact single row each */}
        <div style={{ display: "flex", gap: "16px" }}>
          {CREDITS_SECTIONS.slice(1).map((section) => (
            <div key={section.category} style={{ ...S.sectionBlock, flex: 1 }}>
              <p style={S.sectionHeader}>{section.category}</p>
              {section.items.flatMap((g) => g.entries).map((entry) => (
                <div key={entry.title} style={S.cellTitle}>
                  {entry.title}
                </div>
              ))}
              {section.category === "3D Models" && (
                <div style={{ ...S.cellAuthor, fontSize: "0.7rem", marginTop: "1px" }}>
                  via PolyPizza
                </div>
              )}
            </div>
          ))}
        </div>

        <hr style={S.hr} />

        {/* Back button */}
        <button
          ref={backBtnRef}
          style={S.backBtn}
          onClick={() => { playSFX("button-click"); onClose(); }}
          onMouseEnter={(e) => {
            playSFX("button-hover");
            e.currentTarget.style.borderColor = "var(--rs-orange)";
            e.currentTarget.style.color = "var(--rs-text)";
            e.currentTarget.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--rs-border)";
            e.currentTarget.style.color = "var(--rs-text-muted)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          [ESC] BACK
        </button>
      </div>
    </div>
  );
}
