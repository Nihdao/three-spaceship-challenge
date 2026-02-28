import { useState, useEffect, useRef, useCallback } from "react";
import {
  setMasterVolume,
  setMusicVolume,
  setSFXVolume,
  getMasterVolume,
  getMusicVolume,
  getSfxVolume,
  playSFX,
} from "../../audio/audioManager.js";
import useShipProgression from "../../stores/useShipProgression.jsx";
import useUpgrades from "../../stores/useUpgrades.jsx";
import useArmory from "../../stores/useArmory.jsx";
import useGlobalStats from "../../stores/useGlobalStats.jsx";
import usePlayer from "../../stores/usePlayer.jsx";

export function readAudioSettings() {
  try {
    const raw = localStorage.getItem("audioSettings");
    if (!raw) return { masterVolume: 20, musicVolume: 100, sfxVolume: 100 };
    const parsed = JSON.parse(raw);
    return {
      masterVolume: clampVolume(parsed.masterVolume ?? 20),
      musicVolume: clampVolume(parsed.musicVolume ?? 100),
      sfxVolume: clampVolume(parsed.sfxVolume ?? 100),
    };
  } catch {
    return { masterVolume: 20, musicVolume: 100, sfxVolume: 100 };
  }
}

export function saveAudioSettings(settings) {
  try {
    localStorage.setItem("audioSettings", JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}

export function clampVolume(val) {
  const n = parseInt(val, 10);
  if (!Number.isFinite(n)) return 100;
  return Math.max(0, Math.min(100, n));
}

// ─── styles ─────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(13,11,20,0.88)",
  },
  modal: {
    position: "relative",
    background: "var(--rs-bg-surface)",
    border: "1px solid var(--rs-border)",
    clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
    padding: "32px 32px 24px",
  },
  title: {
    fontFamily: "Bebas Neue, sans-serif",
    fontSize: "2.5rem",
    letterSpacing: "0.15em",
    color: "var(--rs-text)",
    margin: 0,
    lineHeight: 1,
  },
  titleAccent: {
    width: "32px",
    height: "2px",
    background: "var(--rs-orange)",
    marginTop: "6px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  separator: {
    borderTop: "1px solid var(--rs-border)",
    margin: "24px 0",
  },
  btnDanger: {
    width: "100%",
    padding: "12px 0",
    background: "rgba(239,35,60,0.08)",
    border: "1px solid var(--rs-danger)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-danger)",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.75rem",
    letterSpacing: "0.12em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    outline: "none",
    userSelect: "none",
    marginBottom: "8px",
  },
  backBtn: {
    width: "100%",
    padding: "10px 0",
    background: "transparent",
    border: "1px solid var(--rs-border)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text-muted)",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    outline: "none",
  },
  confirmCard: {
    position: "relative",
    background: "var(--rs-bg-surface)",
    border: "1px solid var(--rs-danger)",
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
    padding: "24px",
  },
  btnCancel: {
    flex: 1,
    padding: "8px 0",
    background: "transparent",
    border: "1px solid var(--rs-border)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text-muted)",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    outline: "none",
  },
  btnClearData: {
    flex: 1,
    padding: "8px 0",
    background: "var(--rs-danger)",
    border: "1px solid var(--rs-danger)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text)",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.12em",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 150ms, transform 150ms",
    outline: "none",
  },
};

// ─── component ───────────────────────────────────────────────────────────────

export default function OptionsModal({ onClose }) {
  const [masterVol, setMasterVol] = useState(() => readAudioSettings().masterVolume);
  const [musicVol, setMusicVol] = useState(() => readAudioSettings().musicVolume);
  const [sfxVol, setSfxVol] = useState(() => readAudioSettings().sfxVolume);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const modalRef = useRef(null);
  const backButtonRef = useRef(null);

  // Auto-save to localStorage when any volume changes
  useEffect(() => {
    saveAudioSettings({ masterVolume: masterVol, musicVolume: musicVol, sfxVolume: sfxVol });
  }, [masterVol, musicVol, sfxVol]);

  // ESC key to close (only when confirmation dialog is NOT open)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isClearConfirmOpen) {
          setIsClearConfirmOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isClearConfirmOpen]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const focusable = modal.querySelectorAll(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    modal.addEventListener("keydown", handleTab);
    // Auto-focus first focusable element
    const firstFocusable = modal.querySelector(focusableSelector);
    firstFocusable?.focus();
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isClearConfirmOpen]);

  const updateVolume = useCallback(
    (type, rawValue) => {
      const val = clampVolume(rawValue);
      if (type === "master") {
        setMasterVol(val);
        setMasterVolume(val / 100);
      } else if (type === "music") {
        setMusicVol(val);
        setMusicVolume(val / 100);
      } else if (type === "sfx") {
        setSfxVol(val);
        setSFXVolume(val / 100);
      }
    },
    [],
  );

  const handleClearSave = useCallback(() => {
    try {
      localStorage.clear();
    } catch {
      // localStorage unavailable
    }
    // Reset all persistent stores in memory (localStorage already cleared above)
    useShipProgression.getState().reset();
    useUpgrades.getState().reset();
    useArmory.getState().reset();
    useGlobalStats.getState().reset();
    usePlayer.setState({ fragments: 0, fragmentsEarnedThisRun: 0 });
    setIsClearConfirmOpen(false);
    // Reset audio to defaults
    setMasterVolume(1);
    setMusicVolume(1);
    setSFXVolume(1);
    onClose();
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[55] flex items-center justify-center animate-fade-in"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Options"
    >
      {/* Overlay */}
      <div style={S.overlay} />

      {/* Modal card */}
      <div className="relative w-full max-w-md" style={S.modal}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={S.title}>OPTIONS</h2>
          <div style={S.titleAccent} />
        </div>

        {/* Audio section */}
        <div className="space-y-5 mb-8">
          <VolumeSlider
            label="Master Volume"
            value={masterVol}
            onChange={(v) => updateVolume("master", v)}
          />
          <VolumeSlider
            label="Music Volume"
            value={musicVol}
            onChange={(v) => updateVolume("music", v)}
            onRelease={() => {
              /* music is continuous, no preview needed */
            }}
          />
          <VolumeSlider
            label="SFX Volume"
            value={sfxVol}
            onChange={(v) => updateVolume("sfx", v)}
            onRelease={() => playSFX("button-click")}
          />
        </div>

        {/* Separator */}
        <div style={S.separator} />

        {/* Clear Save */}
        <button
          style={S.btnDanger}
          onClick={() => {
            playSFX("button-click");
            setIsClearConfirmOpen(true);
          }}
          onMouseEnter={(e) => {
            playSFX("button-hover");
            e.currentTarget.style.borderColor = "var(--rs-danger)";
            e.currentTarget.style.color = "var(--rs-text)";
            e.currentTarget.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--rs-danger)";
            e.currentTarget.style.color = "var(--rs-danger)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          CLEAR LOCAL SAVE
        </button>

        {/* Version */}
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--rs-text-dim)', textTransform: 'uppercase', userSelect: 'none' }}>v1</span>
        </div>

        {/* BACK button */}
        <button
          ref={backButtonRef}
          style={S.backBtn}
          onClick={() => {
            playSFX("button-click");
            onClose();
          }}
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

      {/* Confirmation dialog */}
      {isClearConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm clear save data"
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,11,20,0.92)" }} />
          <div className="relative max-w-sm" style={S.confirmCard}>
            <p style={{ color: 'var(--rs-text)', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center', userSelect: 'none' }}>
              Are you sure? This will erase all progress, high scores, and
              settings. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                style={S.btnCancel}
                onClick={() => {
                  playSFX("button-click");
                  setIsClearConfirmOpen(false);
                }}
                onMouseEnter={(e) => {
                  playSFX("button-hover");
                  e.currentTarget.style.borderColor = "var(--rs-orange)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--rs-border)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
                autoFocus
              >
                CANCEL
              </button>
              <button
                style={S.btnClearData}
                onClick={handleClearSave}
                onMouseEnter={(e) => {
                  playSFX("button-hover");
                  e.currentTarget.style.opacity = "0.85";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                CLEAR DATA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VolumeSlider({ label, value, onChange, onRelease }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--rs-text-muted)", textTransform: "uppercase", marginBottom: "6px", userSelect: "none" }}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          onMouseUp={onRelease}
          onTouchEnd={onRelease}
          className="flex-1 h-2 cursor-pointer"
          style={{ accentColor: 'var(--rs-orange)' }}
        />
        <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.9rem", color: "var(--rs-text-muted)", minWidth: "40px", textAlign: "right", userSelect: "none" }}>
          {value}%
        </span>
      </div>
    </div>
  );
}
