import { useState, useEffect, useCallback, useRef } from "react";
import useGame from "../stores/useGame.jsx";
import { playSFX } from "../audio/audioManager.js";
import OptionsModal from "./modals/OptionsModal.jsx";

const MENU_ITEMS = [
  { id: "play", label: "PLAY" },
  { id: "options", label: "OPTIONS" },
  { id: "credits", label: "CREDITS" },
];

export default function MainMenu() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [placeholderModal, setPlaceholderModal] = useState(null); // 'credits' | null
  const playButtonRef = useRef(null);

  // Task 6: High score from localStorage (re-read when options modal closes)
  const readHighScore = useCallback(() => {
    try {
      const stored = localStorage.getItem("highScore");
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      }
    } catch {
      // localStorage unavailable
    }
    return 0;
  }, []);
  const [highScore, setHighScore] = useState(readHighScore);

  // Auto-focus PLAY button on mount for immediate keyboard interaction
  useEffect(() => {
    playButtonRef.current?.focus();
  }, []);

  const handlePlay = useCallback(() => {
    if (fading) return;
    playSFX("button-click");
    setFading(true);
    setTimeout(() => {
      useGame.getState().startGameplay();
    }, 300);
  }, [fading]);

  const handleMenuSelect = useCallback(
    (item) => {
      if (fading) return;
      if (item.id === "play") {
        handlePlay();
      } else if (item.id === "options") {
        playSFX("button-click");
        setIsOptionsOpen(true);
      } else if (item.id === "credits") {
        playSFX("button-click");
        setPlaceholderModal("credits");
      }
    },
    [fading, handlePlay],
  );

  const handleCloseModal = useCallback(() => {
    playSFX("button-click");
    setPlaceholderModal(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (fading) return;

      // Close placeholder modal with Escape (options modal handles its own ESC)
      if (placeholderModal && (e.code === "Escape" || e.code === "Backspace")) {
        e.preventDefault();
        handleCloseModal();
        return;
      }

      // Don't navigate menu while any modal is open
      if (placeholderModal || isOptionsOpen) return;

      if (e.code === "ArrowUp") {
        e.preventDefault();
        playSFX("button-hover");
        setSelectedIndex(
          (i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length,
        );
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        playSFX("button-hover");
        setSelectedIndex((i) => (i + 1) % MENU_ITEMS.length);
      } else if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        handleMenuSelect(MENU_ITEMS[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fading, selectedIndex, placeholderModal, isOptionsOpen, handleMenuSelect, handleCloseModal]);

  return (
    <>
      {/* Fade overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Menu overlay */}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in"
        inert={placeholderModal || isOptionsOpen ? "" : undefined}
      >
        {/* Task 6: High score display */}
        <div className="absolute top-8 right-8 text-right select-none">
          <p className="text-game-text-muted text-xs tracking-[0.3em]">
            BEST RUN
          </p>
          <p className="text-2xl font-bold tabular-nums text-game-text">
            {highScore > 0 ? highScore.toLocaleString() : "---"}
          </p>
        </div>

        {/* Title */}
        <h1
          className="text-5xl font-bold tracking-[0.15em] text-game-text mb-16 select-none"
          style={{ textShadow: "0 0 40px rgba(255, 0, 255, 0.3)" }}
        >
          REDSHIFT SURVIVOR
        </h1>

        {/* Menu items */}
        <div className="flex flex-col items-center gap-4">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.id}
              ref={i === 0 ? playButtonRef : undefined}
              className={`
                w-48 py-3 text-lg font-semibold tracking-widest
                border rounded transition-all duration-150 select-none
                outline-none cursor-pointer
                ${
                  selectedIndex === i
                    ? "border-game-accent text-game-text scale-105 bg-game-accent/10"
                    : "border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text hover:scale-105"
                }
              `}
              onClick={() => handleMenuSelect(item)}
              onMouseEnter={() => {
                setSelectedIndex(i);
                playSFX("button-hover");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options modal */}
      {isOptionsOpen && (
        <OptionsModal
          onClose={() => {
            setIsOptionsOpen(false);
            setHighScore(readHighScore());
          }}
        />
      )}

      {/* Placeholder modal for CREDITS */}
      {placeholderModal && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center font-game animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0a0a0f]/95 border border-game-border rounded-lg p-8 min-w-[300px] text-center">
            <h2 className="text-game-text text-xl font-bold tracking-widest mb-4 select-none">
              CREDITS
            </h2>
            <p className="text-game-text-muted text-sm mb-6 select-none">
              Coming soon
            </p>
            <button
              className="px-6 py-2 text-sm font-semibold tracking-wider border border-game-border rounded
                text-game-text-muted hover:border-game-accent hover:text-game-text
                transition-all duration-150 cursor-pointer select-none outline-none
                focus-visible:ring-2 focus-visible:ring-game-accent"
              onClick={handleCloseModal}
              onMouseEnter={() => playSFX("button-hover")}
              autoFocus
            >
              [ESC] BACK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
