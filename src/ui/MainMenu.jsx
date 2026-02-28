import { useState, useEffect, useCallback, useRef } from "react";
import useGame from "../stores/useGame.jsx";
import usePlayer from "../stores/usePlayer.jsx";
import { playSFX } from "../audio/audioManager.js";
import OptionsModal from "./modals/OptionsModal.jsx";
import CreditsModal from "./modals/CreditsModal.jsx";
import UpgradesScreen from "./UpgradesScreen.jsx";
import Armory from "./Armory.jsx";
import StatsScreen from "./StatsScreen.jsx";
import { FragmentIcon } from "./icons/index.jsx";

export const MENU_ITEMS = [
  { id: "play", label: "PLAY" },
  { id: "upgrades", label: "UPGRADES" },
  { id: "armory", label: "ARMORY" },
  { id: "options", label: "OPTIONS" },
]


const S = {
  menuBtn: {
    width: "14rem",
    padding: "10px 16px",
    background: "rgba(13, 11, 20, 0.72)",
    borderTop: "1px solid var(--rs-border)",
    borderRight: "1px solid var(--rs-border)",
    borderBottom: "1px solid var(--rs-border)",
    borderLeft: "3px solid var(--rs-orange)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text-muted)",
    fontFamily: "Space Mono, monospace",
    fontSize: "0.875rem",
    letterSpacing: "0.12em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    transform: "translateX(0)",
    outline: "none",
  },
  menuBtnSelected: {
    width: "14rem",
    padding: "10px 16px",
    background: "rgba(255, 79, 31, 0.08)",
    borderTop: "1px solid var(--rs-orange)",
    borderRight: "1px solid var(--rs-orange)",
    borderBottom: "1px solid var(--rs-orange)",
    borderLeft: "3px solid var(--rs-orange)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text)",
    fontFamily: "Space Mono, monospace",
    fontSize: "0.875rem",
    letterSpacing: "0.12em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    transform: "translateX(0)",
    outline: "none",
  },
  cornerBtn: {
    background: "rgba(13, 11, 20, 0.82)",
    padding: "6px 14px",
    border: "1px solid var(--rs-border-hot)",
    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
    color: "var(--rs-text)",
    fontFamily: "Space Mono, monospace",
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms, transform 150ms",
    outline: "none",
  },
};

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
  const optionsButtonRef = useRef(null);

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
        className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
        inert={isCreditsOpen || isOptionsOpen ? true : undefined}
      >
        {/* High score & Fragment display */}
        <div className="absolute top-8 right-8 text-right select-none space-y-6">
          <div>
            <p style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              color: "var(--rs-text-muted)",
              textTransform: "uppercase",
            }}>
              BEST RUN
            </p>
            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "1.75rem",
              color: "var(--rs-text)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {highScore > 0 ? highScore.toLocaleString() : "---"}
            </p>
          </div>
          <div>
            <p style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              color: "var(--rs-text-muted)",
              textTransform: "uppercase",
            }}>
              FRAGMENTS
            </p>
            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "1.75rem",
              color: "var(--rs-violet)",
              fontVariantNumeric: "tabular-nums",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              <FragmentIcon size={14} color="var(--rs-violet)" />
              {fragments.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            letterSpacing: "0.12em",
            color: "var(--rs-text)",
            lineHeight: 1,
            margin: 0,
            userSelect: "none",
          }}>
            REDSHIFT SURVIVOR
          </h1>
          <div style={{ width: "32px", height: "2px", background: "var(--rs-orange)", marginTop: "6px", marginBottom: "3rem" }} />
        </div>

        {/* Menu items */}
        <div className="flex flex-col items-center gap-4">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.id}
              ref={item.id === "play" ? playButtonRef : item.id === "options" ? optionsButtonRef : undefined}
              style={selectedIndex === i ? S.menuBtnSelected : S.menuBtn}
              onClick={() => handleMenuSelect(item)}
              onMouseEnter={(e) => {
                setSelectedIndex(i);
                playSFX("button-hover");
                e.currentTarget.style.borderTopColor = "var(--rs-orange)";
                e.currentTarget.style.borderRightColor = "var(--rs-orange)";
                e.currentTarget.style.borderBottomColor = "var(--rs-orange)";
                e.currentTarget.style.color = "var(--rs-text)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                const isSelected = selectedIndex === i;
                e.currentTarget.style.borderTopColor = isSelected ? "var(--rs-orange)" : "var(--rs-border)";
                e.currentTarget.style.borderRightColor = isSelected ? "var(--rs-orange)" : "var(--rs-border)";
                e.currentTarget.style.borderBottomColor = isSelected ? "var(--rs-orange)" : "var(--rs-border)";
                e.currentTarget.style.color = isSelected ? "var(--rs-text)" : "var(--rs-text-muted)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottom-right: version */}
        <span style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.1em',
          color: 'var(--rs-text-dim)',
          textTransform: 'uppercase',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          v1
        </span>

        {/* Bottom-left: Stats & Credits */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 select-none">
          <button
            ref={statsButtonRef}
            style={S.cornerBtn}
            onClick={() => { playSFX("button-click"); setIsStatsOpen(true); }}
            onMouseEnter={(e) => {
              playSFX("button-hover");
              e.currentTarget.style.borderColor = "var(--rs-orange)";
              e.currentTarget.style.color = "var(--rs-text)";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--rs-border-hot)";
              e.currentTarget.style.color = "var(--rs-text)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            STATS
          </button>
          <button
            ref={creditsButtonRef}
            style={S.cornerBtn}
            onClick={() => { playSFX("button-click"); setIsCreditsOpen(true); }}
            onMouseEnter={(e) => {
              playSFX("button-hover");
              e.currentTarget.style.borderColor = "var(--rs-orange)";
              e.currentTarget.style.color = "var(--rs-text)";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--rs-border-hot)";
              e.currentTarget.style.color = "var(--rs-text)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
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
            setTimeout(() => optionsButtonRef.current?.focus(), 0);
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
