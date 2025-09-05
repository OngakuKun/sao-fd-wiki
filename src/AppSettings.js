// src/AppSettings.js
import { useEffect, useRef } from "react";
import "./AppSettings.css";

import { DE, GB } from 'country-flag-icons/string/3x2'

export default function AppSettings({
  open, onClose,
  theme, setTheme,
  accent, setAccent,
  language, setLanguage,
}) {
  const popupRef = useRef(null);

  const themes = ["latte", "frappe", "macchiato", "mocha"];
  const accents = [
    "rosewater", "flamingo", "pink", "mauve", "red",
    "maroon", "peach", "yellow", "green", "teal",
    "sky", "sapphire", "blue", "lavender"
  ];

  const languages = [
    { code: "en", label: "English", flag: GB },
    { code: "de", label: "Deutsch", flag: DE },
  ];

  // Focus trap & ESC
  useEffect(() => {
    if (!open) return;

    const popup = popupRef.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(popup.querySelectorAll(focusableSelectors));

    // Focus first element
    if (focusableElements.length) focusableElements[0].focus();

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab") {
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-popup" ref={popupRef} onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        {/* Language */}
        <section>
          <h3>Language</h3>
          <div className="lang-options">
            {languages.map((l) => (
              <button
                key={l.code}
                className={`lang-btn interactive ${language === l.code ? "active" : ""}`}
                onClick={() => setLanguage(l.code)}
              >
                <span
                    className="flag-icon"
                    dangerouslySetInnerHTML={{ __html: l.flag }}
                />
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
            <h3>Catppuccin Theme</h3>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <a 
              href="https://catppuccin.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontSize: '12px',
                opacity: 0.7,
                transition: 'opacity 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              Learn more about Catppuccin
            </a>
          </div>
          <div className="theme-options">
            {themes.map((t) => (
              <button
                key={t}
                className={`theme-btn interactive ${theme === t ? "active" : ""}`}
                onClick={() => {
                  setTheme(t);
                  document.documentElement.setAttribute("data-theme", t);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Accent */}
        <section>
          <h3>Accent</h3>
          <div className="accent-options">
            {accents.map((a) => (
              <button
                key={a}
                className={`accent-btn ${accent === a ? "active" : ""}`}
                style={{
                    backgroundColor: `var(--ctp-${a})`,
                    '--shadow-color': `var(--ctp-${a})`
                }}
                onClick={() => {
                  setAccent(a);
                  document.documentElement.style.setProperty(
                    "--accent",
                    `var(--ctp-${a})`
                  );
                }}
              />
            ))}
          </div>
        </section>

        <button className="close-btn interactive" onClick={onClose}>
          ESC to close
        </button>
      </div>
    </div>
  );
}

