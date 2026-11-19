export default function PortalLedge({ showProps = true }) {
  return (
    <div className="portal-ledge" aria-hidden="true">
      <svg className="portal-ledge-bg" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tableSurfaceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7e8ce" />
            <stop offset="40%" stopColor="#edd4af" />
            <stop offset="100%" stopColor="#deb98c" />
          </linearGradient>
          <linearGradient id="tableFrontGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8c582c" />
            <stop offset="50%" stopColor="#73431d" />
            <stop offset="100%" stopColor="#572f10" />
          </linearGradient>
          <linearGradient id="tableDepthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d1f09" />
            <stop offset="100%" stopColor="#241103" />
          </linearGradient>
          <linearGradient id="loafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fcd36a" />
            <stop offset="45%" stopColor="#e39129" />
            <stop offset="100%" stopColor="#aa5a13" />
          </linearGradient>
        </defs>

        <rect x="0" y="44" width="1440" height="18" fill="url(#tableSurfaceGrad)" />
        <line x1="0" y1="44" x2="1440" y2="44" stroke="#fff4e0" strokeWidth="2.5" />
        <line x1="0" y1="62" x2="1440" y2="62" stroke="#cca16e" strokeWidth="1.5" />
        <rect x="0" y="62" width="1440" height="24" fill="url(#tableFrontGrad)" />
        <rect x="0" y="86" width="1440" height="14" fill="url(#tableDepthGrad)" />
      </svg>

      {showProps && (
        <div className="portal-ledge-props">
          <div className="bakery-table-left">
            <div className="bakery-prop tier-cake">
              <svg width="86" height="72" viewBox="0 0 86 72" fill="none">
                <ellipse cx="43" cy="67" rx="40" ry="4.5" fill="#fcfaf7" stroke="#e0d4c3" strokeWidth="1.5" />
                <path d="M11 44 C11 40 25 37 43 37 C61 37 75 40 75 44 L75 62 C75 66 61 68 43 68 C25 68 11 66 11 62 Z" fill="#4d3023" />
                <path d="M11 44 C16 48 18 55 21 50 C24 45 27 56 31 51 C35 46 38 58 43 51 C48 45 52 57 56 50 C60 44 63 54 67 48 C70 43 73 50 75 44" fill="#ffffff" />
                <ellipse cx="43" cy="43" rx="32" ry="6" fill="#ffffff" />
                <circle cx="21" cy="43" r="1.8" fill="#e83642" />
                <circle cx="29" cy="45" r="1.8" fill="#f2c230" />
                <circle cx="38" cy="42" r="1.8" fill="#4ea85b" />
                <circle cx="48" cy="44" r="1.8" fill="#2b82d4" />
                <circle cx="58" cy="42" r="1.8" fill="#e83642" />
                <circle cx="66" cy="44" r="1.8" fill="#f2c230" />

                <path d="M23 24 C23 20 32 18 43 18 C54 18 63 20 63 24 L63 38 C63 41 54 43 43 43 C32 43 23 41 23 38 Z" fill="#fcedec" stroke="#e8b8b8" strokeWidth="0.8" />
                <path d="M23 24 C26 27 28 32 31 29 C34 25 37 33 41 28 C45 24 49 32 53 28 C57 24 60 30 63 24" fill="#4d3023" />
                <ellipse cx="43" cy="23" rx="20" ry="4.5" fill="#fde6e8" />

                <path d="M37 14 L39 21 L47 21 L49 14 Z" fill="#fae8dc" stroke="#dfb698" strokeWidth="0.8" />
                <path d="M36 14 C36 10 40 8 43 8 C46 8 50 10 50 14 Z" fill="#ffffff" />
                <circle cx="43" cy="7" r="3.5" fill="#d3222a" />
                <circle cx="42" cy="6" r="1" fill="#ffffff" opacity="0.8" />
              </svg>
            </div>

            <div className="bakery-prop shortcake-stand">
              <svg width="76" height="70" viewBox="0 0 76 70" fill="none">
                <path d="M33 50 L33 62 L22 66 L54 66 L43 62 L43 50 Z" fill="#ffffff" stroke="#ded4c4" strokeWidth="1.2" />
                <ellipse cx="38" cy="50" rx="35" ry="6.5" fill="#ffffff" stroke="#dfd6c6" strokeWidth="1.5" />
                <path d="M15 28 C15 23 25 20 38 20 C51 20 61 23 61 28 L61 44 C61 48 51 51 38 51 C25 51 15 48 15 44 Z" fill="#fef6eb" stroke="#ecd9bf" strokeWidth="1" />
                <path d="M15 37 C21 39 31 40 38 40 C45 40 55 39 61 37" stroke="#f28b97" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <ellipse cx="38" cy="27" rx="23" ry="6.5" fill="#ffffff" />
                <path d="M28 20 C28 15 34 13 34 18 C34 21 28 24 28 20 Z" fill="#e83642" />
                <path d="M38 18 C38 12 45 11 45 16 C45 20 38 23 38 18 Z" fill="#d92532" />
                <circle cx="48" cy="22" r="4.2" fill="#e83642" />
                <path d="M33 13 C31 10 35 9 37 12 C35 14 34 14 33 13 Z" fill="#4ea85b" />
                <path d="M44 11 C46 8 49 10 47 13 C45 14 44 13 44 11 Z" fill="#4ea85b" />
              </svg>
            </div>

            <div className="bakery-prop striped-cupcake">
              <svg width="46" height="54" viewBox="0 0 46 54" fill="none">
                <path d="M9 28 L14 48 C14 50 32 50 32 48 L37 28 Z" fill="#ffffff" stroke="#dfb698" strokeWidth="1.2" />
                <path d="M12 28 L16 48 L19 48 L16 28 Z" fill="#f7b7cb" />
                <path d="M21 28 L23 48 L26 48 L25 28 Z" fill="#f7b7cb" />
                <path d="M30 28 L30 48 L32 48 L34 28 Z" fill="#f7b7cb" />
                <path d="M8 28 C7 22 15 19 23 19 C31 19 39 22 38 28 C36 32 10 32 8 28 Z" fill="#fde2df" />
                <path d="M11 22 C12 16 18 14 23 14 C28 14 34 16 35 22 Z" fill="#f8c3be" />
                <path d="M17 16 C18 10 21 9 23 9 C25 9 28 10 29 16 Z" fill="#ffffff" />
                <circle cx="23" cy="9" r="5" fill="#d3222a" />
                <circle cx="21.5" cy="7.5" r="1.5" fill="#ffffff" opacity="0.8" />
                <line x1="23" y1="4" x2="23" y2="0" stroke="#b8935c" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="23 0, 31 3, 23 6" fill="#e83642" />
              </svg>
            </div>
          </div>

          <div className="bakery-table-right">
            <div className="bakery-prop brioche-bread">
              <svg width="86" height="52" viewBox="0 0 86 52" fill="none">
                <ellipse cx="43" cy="47" rx="38" ry="4" fill="rgba(30, 15, 5, 0.25)" />
                <path d="M6 34 C6 22 18 14 32 14 C44 14 56 16 66 22 C78 28 82 36 78 42 C74 46 60 48 43 48 C20 48 6 44 6 34 Z" fill="url(#loafGrad)" stroke="#8f4708" strokeWidth="1.2" />
                <path d="M18 20 C24 16 32 24 38 34" stroke="#fde398" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M34 16 C40 14 50 24 54 36" stroke="#fde398" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M52 18 C58 18 66 28 68 38" stroke="#fde398" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M12 28 C16 32 22 36 28 40" stroke="#7a3a05" strokeWidth="1.5" fill="none" />
                <path d="M28 26 C34 32 40 38 46 42" stroke="#7a3a05" strokeWidth="1.5" fill="none" />
                <path d="M46 26 C52 32 58 38 64 42" stroke="#7a3a05" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            <div className="bakery-prop choco-stand">
              <svg width="78" height="70" viewBox="0 0 78 70" fill="none">
                <path d="M34 50 L34 62 L23 66 L55 66 L44 62 L44 50 Z" fill="#ffffff" stroke="#ded4c4" strokeWidth="1.2" />
                <ellipse cx="39" cy="50" rx="36" ry="6.5" fill="#ffffff" stroke="#dfd6c6" strokeWidth="1.5" />
                <path d="M14 28 C14 22 25 19 39 19 C53 19 64 22 64 28 L64 45 C64 49 53 51 39 51 C25 51 14 49 14 45 Z" fill="#4d3023" />
                <path d="M14 28 C17 33 19 39 22 34 C25 29 28 40 32 35 C36 30 39 42 43 36 C47 30 50 38 54 33 C58 29 61 36 64 28" fill="#2d170e" />
                <ellipse cx="39" cy="27" rx="25" ry="7" fill="#2d170e" />
                <circle cx="28" cy="22" r="4.5" fill="#ffffff" />
                <circle cx="28" cy="18" r="2.8" fill="#e82c38" />
                <circle cx="39" cy="20" r="5" fill="#ffffff" />
                <circle cx="39" cy="16" r="3.2" fill="#283e78" />
                <circle cx="50" cy="22" r="4.5" fill="#ffffff" />
                <circle cx="50" cy="18" r="2.8" fill="#e82c38" />
                <path d="M30 16 L48 5" stroke="#d99955" strokeWidth="3" strokeLinecap="round" />
                <path d="M33 14 L35 13 M39 10 L41 9 M44 7 L46 6" stroke="#75471c" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="bakery-prop duo-cupcakes">
              <svg width="70" height="52" viewBox="0 0 70 52" fill="none">
                <path d="M8 27 L11 46 C11 47 27 47 27 46 L30 27 Z" fill="#fae8dc" stroke="#e0b89b" strokeWidth="1" />
                <path d="M7 27 C6 21 13 18 19 18 C25 18 32 21 31 27 Z" fill="#b0d69b" />
                <path d="M12 19 C13 13 17 11 19 11 C21 11 25 13 26 19 Z" fill="#9bc485" />
                <circle cx="19" cy="10" r="3.5" fill="#e83642" />
                <line x1="14" y1="21" x2="16" y2="23" stroke="#4a2c17" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="22" y1="20" x2="24" y2="22" stroke="#4a2c17" strokeWidth="1.5" strokeLinecap="round" />

                <path d="M42 27 L45 46 C45 47 61 47 61 46 L64 27 Z" fill="#fae8dc" stroke="#e0b89b" strokeWidth="1" />
                <path d="M41 27 C40 21 47 18 53 18 C59 18 66 21 65 27 Z" fill="#4d3023" />
                <path d="M46 19 C47 13 51 11 53 11 C55 11 59 13 60 19 Z" fill="#ffffff" />
                <circle cx="53" cy="11" r="2.5" fill="#283e78" />
                <circle cx="48" cy="22" r="1.5" fill="#f2c230" />
                <circle cx="58" cy="22" r="1.5" fill="#e83642" />
                <path d="M52 10 L60 2" stroke="#d99955" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
