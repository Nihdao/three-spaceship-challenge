import { useState, useEffect, useCallback, useRef } from "react";
import useGame from "../stores/useGame.jsx";
import usePlayer from "../stores/usePlayer.jsx";
import { playSFX } from "../audio/audioManager.js";
import OptionsModal from "./modals/OptionsModal.jsx";
import CreditsModal from "./modals/CreditsModal.jsx";
import UpgradesScreen from "./UpgradesScreen.jsx";
import Armory from "./Armory.jsx";
import StatsScreen from "./StatsScreen.jsx";

export const MENU_ITEMS = [
  { id: "play", label: "PLAY" },
  { id: "upgrades", label: "UPGRADES" },
  { id: "armory", label: "ARMORY" },
  { id: "stats", label: "STATS" },
];

export default function MainMenu() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const playButtonRef = useRef(null);
  const creditsButtonRef = useRef(null);
  const statsButtonRef = useRef(null);

  // High score from store (loaded from localStorage)
  const highScore = useGame((s) => s.highScore);
  // Fragment count from player store (in-memory, earned during runs)
  const fragments = usePlayer((s) => s.fragments);

  // Load high score from localStorage on mount
  useEffect(() => {
    useGame.getState().loadHighScore();
  }, []);

  // Auto-focus PLAY button on mount for immediate keyboard interaction
  useEffect(() => {
    playButtonRef.current?.focus();
  }, []);

  const handlePlay = useCallback(() => {
    if (fading) return;
    playSFX("button-click");
    setFading(true);
    setTimeout(() => {
      useGame.getState().setPhase('shipSelect');
    }, 300);
  }, [fading]);

  const handleMenuSelect = useCallback(
    (item) => {
      if (fading) return;
      if (item.id === "play") {
        handlePlay();
      } else if (item.id === "armory") {
        playSFX("button-click");
        setIsArmoryOpen(true);
      } else if (item.id === "stats") {
        playSFX("button-click");
        setIsStatsOpen(true);
      } else if (item.id === "upgrades") {
        playSFX("button-click");
        setIsUpgradesOpen(true);
      } else if (item.id === "options") {
        playSFX("button-click");
        setIsOptionsOpen(true);
      } else if (item.id === "credits") {
        playSFX("button-click");
        setIsCreditsOpen(true);
      }
    },
    [fading, handlePlay],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (fading) return;

      // Don't navigate menu while any modal is open
      if (isCreditsOpen || isOptionsOpen || isUpgradesOpen || isArmoryOpen || isStatsOpen) return;

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
  }, [fading, selectedIndex, isCreditsOpen, isOptionsOpen, isUpgradesOpen, isArmoryOpen, isStatsOpen, handleMenuSelect]);

  return (
    <>
      {/* Fade overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-300"
        style={{ opacity: fading ? 1 : 0 }}
      />

      {/* Menu overlay — hidden when upgrades, armory, or stats screen is open */}
      {!isUpgradesOpen && !isArmoryOpen && !isStatsOpen && <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in"
        inert={isCreditsOpen || isOptionsOpen ? "" : undefined}
      >
        {/* High score & Fragment display */}
        <div className="absolute top-8 right-8 text-right select-none space-y-6">
          <div>
            <p className="text-game-text-muted text-xs tracking-[0.3em]">
              BEST RUN
            </p>
            <p className="text-2xl font-bold tabular-nums text-game-text">
              {highScore > 0 ? highScore.toLocaleString() : "---"}
            </p>
          </div>
          <div>
            <p className="text-game-text-muted text-xs tracking-[0.3em]">
              FRAGMENTS
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#cc66ff]">
              ◆ {fragments.toLocaleString()}
            </p>
          </div>
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
              ref={item.id === "play" ? playButtonRef : item.id === "stats" ? statsButtonRef : undefined}
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

        {/* Bottom-left: Options & Credits */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 select-none">
          <button
            onClick={() => { playSFX("button-click"); setIsOptionsOpen(true); }}
            onMouseEnter={() => playSFX("button-hover")}
            className="px-4 py-2 text-sm tracking-widest border border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text transition-all duration-150 rounded outline-none cursor-pointer"
          >
            OPTIONS
          </button>
          <button
            ref={creditsButtonRef}
            onClick={() => { playSFX("button-click"); setIsCreditsOpen(true); }}
            onMouseEnter={() => playSFX("button-hover")}
            className="px-4 py-2 text-sm tracking-widest border border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text transition-all duration-150 rounded outline-none cursor-pointer"
          >
            CREDITS
          </button>
        </div>
      </div>}

      {/* Options modal */}
      {isOptionsOpen && (
        <OptionsModal
          onClose={() => {
            setIsOptionsOpen(false);
            // Reload high score in case clear save was used
            useGame.getState().loadHighScore();
          }}
        />
      )}

      {/* Credits modal */}
      {isCreditsOpen && (
        <CreditsModal onClose={() => {
          setIsCreditsOpen(false);
          setTimeout(() => creditsButtonRef.current?.focus(), 0);
        }} />
      )}

      {/* Upgrades screen overlay */}
      {isUpgradesOpen && (
        <UpgradesScreen onClose={() => setIsUpgradesOpen(false)} />
      )}

      {/* Armory screen overlay */}
      {isArmoryOpen && (
        <Armory onClose={() => setIsArmoryOpen(false)} />
      )}

      {/* Stats screen overlay */}
      {isStatsOpen && (
        <StatsScreen onClose={() => {
          setIsStatsOpen(false);
          setTimeout(() => statsButtonRef.current?.focus(), 0);
        }} />
      )}
    </>
  );
}
