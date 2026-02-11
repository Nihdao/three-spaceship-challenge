import { useEffect, useRef, useId } from "react";
import { playSFX } from "../../audio/audioManager.js";

export const CREDITS_SECTIONS = [
  { category: "3D Models", credit: "To be credited" },
  { category: "Sound Effects", credit: "To be credited" },
  { category: "Music", credit: "To be credited" },
  { category: "Textures", credit: "To be credited" },
];

export default function CreditsModal({ onClose }) {
  const titleId = useId();
  const modalRef = useRef(null);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

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
    const firstFocusable = modal.querySelector(focusableSelector);
    firstFocusable?.focus();
    return () => modal.removeEventListener("keydown", handleTab);
  }, []);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[55] flex items-center justify-center font-game animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal card */}
      <div className="relative bg-[#0a0a0f] border-2 border-game-primary rounded-lg p-8 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Title */}
        <h2
          id={titleId}
          className="text-3xl font-bold text-game-text text-center mb-8 tracking-widest select-none"
        >
          CREDITS
        </h2>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-game-primary">
          {/* ThreeJS Journey Challenge section */}
          <div className="mb-8">
            <p className="text-lg text-game-text mb-2">
              Created for the{" "}
              <strong>ThreeJS Journey Challenge - Spaceship</strong>
            </p>
            <a
              href="https://threejs-journey.com/challenges/022-spaceship"
              target="_blank"
              rel="noopener noreferrer"
              className="text-game-primary hover:underline inline-flex items-center gap-1 mb-4"
            >
              View Challenge <span aria-hidden="true">↗</span>
            </a>
            <p className="text-base text-game-text mb-2">
              Course by <strong>Bruno Simon</strong>
            </p>
            <a
              href="https://threejs-journey.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-game-primary hover:underline inline-flex items-center gap-1"
            >
              ThreeJS Journey <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/* Separator */}
          <div className="border-t border-game-primary/30 pt-6">
            <h3 className="text-xl font-bold text-game-text mb-4">
              Assets & Resources
            </h3>

            {CREDITS_SECTIONS.map((section) => (
              <div key={section.category} className="mb-4">
                <h4 className="font-bold text-game-text mb-1">
                  {section.category}
                </h4>
                <p className="text-game-text opacity-70">{section.credit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BACK button */}
        <button
          className="mt-6 w-full py-3 text-sm font-semibold tracking-wider border border-game-border rounded
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
    </div>
  );
}
