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

export function readAudioSettings() {
  try {
    const raw = localStorage.getItem("audioSettings");
    if (!raw) return { masterVolume: 100, musicVolume: 100, sfxVolume: 100 };
    const parsed = JSON.parse(raw);
    return {
      masterVolume: clampVolume(parsed.masterVolume ?? 100),
      musicVolume: clampVolume(parsed.musicVolume ?? 100),
      sfxVolume: clampVolume(parsed.sfxVolume ?? 100),
    };
  } catch {
    return { masterVolume: 100, musicVolume: 100, sfxVolume: 100 };
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
      className="fixed inset-0 z-[55] flex items-center justify-center font-game animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Options"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal card */}
      <div className="relative bg-[#0a0a0f] border-2 border-game-primary rounded-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-game-text text-center mb-8 tracking-widest select-none">
          OPTIONS
        </h2>

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
        <div className="border-t border-game-border my-6" />

        {/* Clear Save */}
        <button
          className="w-full py-3 text-sm font-bold tracking-wider rounded
            bg-game-danger/20 border border-game-danger text-game-danger
            hover:bg-game-danger hover:text-white
            transition-all duration-150 cursor-pointer select-none
            outline-none focus-visible:ring-2 focus-visible:ring-game-danger mb-4"
          onClick={() => {
            playSFX("button-click");
            setIsClearConfirmOpen(true);
          }}
        >
          CLEAR LOCAL SAVE
        </button>

        {/* BACK button */}
        <button
          ref={backButtonRef}
          className="w-full py-3 text-sm font-semibold tracking-wider border border-game-border rounded
            text-game-text-muted hover:border-game-accent hover:text-game-text
            transition-all duration-150 cursor-pointer select-none
            outline-none focus-visible:ring-2 focus-visible:ring-game-accent"
          onClick={() => {
            playSFX("button-click");
            onClose();
          }}
          onMouseEnter={() => playSFX("button-hover")}
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
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative bg-[#0a0a0f] border-2 border-game-danger rounded-lg p-6 max-w-sm">
            <p className="text-game-text text-sm mb-6 text-center select-none">
              Are you sure? This will erase all progress, high scores, and
              settings. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                className="flex-1 py-2 text-sm font-semibold tracking-wider border border-game-border rounded
                  text-game-text-muted hover:border-game-accent hover:text-game-text
                  transition-all duration-150 cursor-pointer select-none
                  outline-none focus-visible:ring-2 focus-visible:ring-game-accent"
                onClick={() => {
                  playSFX("button-click");
                  setIsClearConfirmOpen(false);
                }}
                onMouseEnter={() => playSFX("button-hover")}
                autoFocus
              >
                CANCEL
              </button>
              <button
                className="flex-1 py-2 text-sm font-bold tracking-wider rounded
                  bg-game-danger text-white hover:bg-red-700
                  transition-all duration-150 cursor-pointer select-none
                  outline-none focus-visible:ring-2 focus-visible:ring-game-danger"
                onClick={handleClearSave}
                onMouseEnter={() => playSFX("button-hover")}
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
      <label className="block text-game-text text-sm mb-1 select-none">
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
          className="flex-1 accent-game-primary h-2 rounded-full cursor-pointer"
        />
        <span className="text-game-text tabular-nums w-10 text-right text-sm select-none">
          {value}%
        </span>
      </div>
    </div>
  );
}
