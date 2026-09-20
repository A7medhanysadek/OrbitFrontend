// ═══════════════════════════════════════════
// OrbitEmotes.js — Custom SVG Emotes for Orbit Platform
// 12 platform-authentic emotes designed for the cosmic theme
// ═══════════════════════════════════════════

/**
 * Each emote is an inline SVG designed to match Orbit's
 * cyan/space aesthetic. They replace the generic unicode emoji presets.
 */
export const OrbitEmotes = {
  orbitHype: {
    name: 'orbitHype',
    label: 'Hype Rocket',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hype-g" x1="10" y1="40" x2="38" y2="8">
          <stop offset="0%" stop-color="#00AEBD"/>
          <stop offset="100%" stop-color="#00f2fe"/>
        </linearGradient>
      </defs>
      <path d="M24 4L30 18H18L24 4Z" fill="url(#hype-g)" opacity="0.9"/>
      <rect x="20" y="18" width="8" height="16" rx="2" fill="url(#hype-g)"/>
      <path d="M16 28L20 22V34L16 28Z" fill="#00AEBD" opacity="0.7"/>
      <path d="M32 28L28 22V34L32 28Z" fill="#00AEBD" opacity="0.7"/>
      <ellipse cx="24" cy="38" rx="5" ry="7" fill="#FF6B35" opacity="0.8"/>
      <ellipse cx="24" cy="40" rx="3" ry="5" fill="#FFD93D" opacity="0.9"/>
      <circle cx="24" cy="14" r="2" fill="#fff" opacity="0.9"/>
    </svg>`
  },

  orbitFire: {
    name: 'orbitFire',
    label: 'Cosmic Flame',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fire-g" x1="24" y1="44" x2="24" y2="4">
          <stop offset="0%" stop-color="#FF1400"/>
          <stop offset="40%" stop-color="#FF6B35"/>
          <stop offset="70%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <path d="M24 4C24 4 32 14 34 22C36 30 30 40 24 44C18 40 12 30 14 22C16 14 24 4 24 4Z" fill="url(#fire-g)" opacity="0.9"/>
      <path d="M24 16C24 16 28 22 29 26C30 30 27 36 24 38C21 36 18 30 19 26C20 22 24 16 24 16Z" fill="#00f2fe" opacity="0.6"/>
      <ellipse cx="24" cy="30" rx="4" ry="6" fill="#fff" opacity="0.3"/>
      <circle cx="22" cy="12" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="28" cy="18" r="0.8" fill="#fff" opacity="0.6"/>
    </svg>`
  },

  orbitPog: {
    name: 'orbitPog',
    label: 'Amazed Planet',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pog-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#pog-g)" opacity="0.9"/>
      <circle cx="24" cy="24" r="18" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity="0.5"/>
      <ellipse cx="18" cy="20" rx="3.5" ry="4.5" fill="#070a14"/>
      <ellipse cx="30" cy="20" rx="3.5" ry="4.5" fill="#070a14"/>
      <circle cx="18" cy="19" r="1.5" fill="#fff"/>
      <circle cx="30" cy="19" r="1.5" fill="#fff"/>
      <ellipse cx="24" cy="31" rx="5" ry="6" fill="#070a14"/>
      <ellipse cx="24" cy="30" rx="3" ry="2" fill="#00f2fe" opacity="0.3"/>
      <path d="M10 12C14 8 18 10 20 12" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
      <path d="M28 12C30 10 34 8 38 12" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
    </svg>`
  },

  orbitLove: {
    name: 'orbitLove',
    label: 'Nebula Heart',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="love-g" x1="10" y1="10" x2="38" y2="40">
          <stop offset="0%" stop-color="#FF69B4"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#7928CA"/>
        </linearGradient>
        <filter id="love-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M24 42L8 24C4 18 6 10 14 8C18 7 22 9 24 12C26 9 30 7 34 8C42 10 44 18 40 24L24 42Z" fill="url(#love-g)" filter="url(#love-glow)" opacity="0.9"/>
      <path d="M24 36L14 24C12 20 13 16 17 14C19 13 22 14 24 17C26 14 29 13 31 14C35 16 36 20 34 24L24 36Z" fill="#fff" opacity="0.15"/>
      <circle cx="16" cy="18" r="1.5" fill="#fff" opacity="0.7"/>
      <circle cx="20" cy="14" r="1" fill="#fff" opacity="0.5"/>
    </svg>`
  },

  orbitGG: {
    name: 'orbitGG',
    label: 'Star Trophy',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gg-g" x1="14" y1="6" x2="34" y2="42">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="100%" stop-color="#FF6B35"/>
        </linearGradient>
      </defs>
      <path d="M24 4L28 16H40L30 24L34 36L24 28L14 36L18 24L8 16H20L24 4Z" fill="url(#gg-g)" opacity="0.9"/>
      <path d="M24 10L26.5 18H34L28 23L30.5 31L24 26L17.5 31L20 23L14 18H21.5L24 10Z" fill="#fff" opacity="0.2"/>
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#00AEBD" opacity="0.8"/>
      <rect x="16" y="40" width="16" height="3" rx="1.5" fill="#00AEBD"/>
      <text x="24" y="25" text-anchor="middle" fill="#070a14" font-size="8" font-weight="900" font-family="sans-serif">GG</text>
    </svg>`
  },

  orbitLUL: {
    name: 'orbitLUL',
    label: 'Laughing Moon',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lul-g" cx="40%" cy="40%">
          <stop offset="0%" stop-color="#E8E0D0"/>
          <stop offset="100%" stop-color="#9DB2CE"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#lul-g)" opacity="0.9"/>
      <circle cx="18" cy="14" r="3" fill="#9DB2CE" opacity="0.3"/>
      <circle cx="32" cy="20" r="2" fill="#9DB2CE" opacity="0.2"/>
      <circle cx="26" cy="10" r="1.5" fill="#9DB2CE" opacity="0.25"/>
      <path d="M14 20C14 20 16 17 18 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M30 20C30 20 32 17 34 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M15 28C18 34 30 34 33 28" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M16 28C19 32 29 32 32 28" fill="#070a14" opacity="0.8"/>
      <circle cx="14" cy="25" r="2.5" fill="#FF69B4" opacity="0.25"/>
      <circle cx="34" cy="25" r="2.5" fill="#FF69B4" opacity="0.25"/>
    </svg>`
  },

  orbitSad: {
    name: 'orbitSad',
    label: 'Crying Comet',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sad-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#5B7FBB"/>
          <stop offset="100%" stop-color="#2C3E6B"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="22" r="16" fill="url(#sad-g)" opacity="0.9"/>
      <circle cx="24" cy="22" r="16" fill="none" stroke="#5B7FBB" stroke-width="1" opacity="0.4"/>
      <ellipse cx="18" cy="19" rx="3" ry="3.5" fill="#0f1424"/>
      <ellipse cx="30" cy="19" rx="3" ry="3.5" fill="#0f1424"/>
      <circle cx="17" cy="18" r="1.2" fill="#fff" opacity="0.7"/>
      <circle cx="29" cy="18" r="1.2" fill="#fff" opacity="0.7"/>
      <path d="M19 29C21 27 27 27 29 29" stroke="#0f1424" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M16 24L14 34L16 32L14 42" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M32 24L34 34L32 32L34 42" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <circle cx="15" cy="36" r="1.5" fill="#00f2fe" opacity="0.5"/>
      <circle cx="33" cy="38" r="1" fill="#00f2fe" opacity="0.4"/>
    </svg>`
  },

  orbitCrown: {
    name: 'orbitCrown',
    label: 'Cosmic Crown',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crown-g" x1="8" y1="16" x2="40" y2="40">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#7928CA"/>
        </linearGradient>
      </defs>
      <path d="M6 34L12 14L20 24L24 10L28 24L36 14L42 34H6Z" fill="url(#crown-g)" opacity="0.9"/>
      <rect x="6" y="34" width="36" height="6" rx="2" fill="url(#crown-g)"/>
      <circle cx="12" cy="14" r="3" fill="#FFD93D"/>
      <circle cx="24" cy="10" r="3" fill="#00f2fe"/>
      <circle cx="36" cy="14" r="3" fill="#7928CA"/>
      <circle cx="12" cy="14" r="1.5" fill="#fff" opacity="0.6"/>
      <circle cx="24" cy="10" r="1.5" fill="#fff" opacity="0.6"/>
      <circle cx="36" cy="14" r="1.5" fill="#fff" opacity="0.6"/>
      <rect x="14" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
      <rect x="22" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
      <rect x="30" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
    </svg>`
  },

  orbitWave: {
    name: 'orbitWave',
    label: 'Waving Satellite',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wave-g" x1="12" y1="12" x2="36" y2="36">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <rect x="18" y="18" width="12" height="12" rx="2" fill="url(#wave-g)" transform="rotate(45 24 24)"/>
      <line x1="16" y1="16" x2="8" y2="8" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="16" x2="40" y2="8" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="32" x2="8" y2="40" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="32" x2="40" y2="40" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="3" fill="#00f2fe" opacity="0.8"/>
      <circle cx="40" cy="8" r="3" fill="#00f2fe" opacity="0.8"/>
      <circle cx="24" cy="24" r="3" fill="#fff" opacity="0.3"/>
      <path d="M4 18C2 14 2 10 4 6" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M2 20C-1 14 -1 8 2 4" stroke="#00f2fe" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.3"/>
      <path d="M44 18C46 14 46 10 44 6" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
    </svg>`
  },

  orbitRage: {
    name: 'orbitRage',
    label: 'Exploding Star',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rage-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#FF6B35"/>
          <stop offset="60%" stop-color="#FF1400"/>
          <stop offset="100%" stop-color="#8B0000"/>
        </radialGradient>
      </defs>
      <polygon points="24,2 28,14 42,14 31,22 35,36 24,28 13,36 17,22 6,14 20,14" fill="url(#rage-g)" opacity="0.9"/>
      <circle cx="24" cy="22" r="10" fill="#FF1400" opacity="0.5"/>
      <path d="M16 18L20 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 18L28 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="19" cy="22" rx="2" ry="2.5" fill="#070a14"/>
      <ellipse cx="29" cy="22" rx="2" ry="2.5" fill="#070a14"/>
      <circle cx="19" cy="21.5" r="0.8" fill="#FF6B35"/>
      <circle cx="29" cy="21.5" r="0.8" fill="#FF6B35"/>
      <path d="M20 28L24 26L28 28" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="44" y1="4" x2="38" y2="10" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="4" y1="44" x2="10" y2="38" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="44" y1="44" x2="38" y2="38" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
    </svg>`
  },

  orbitChill: {
    name: 'orbitChill',
    label: 'Cool Planet',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="chill-g" cx="45%" cy="45%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="26" r="16" fill="url(#chill-g)" opacity="0.9"/>
      <circle cx="18" cy="20" r="4" fill="#00AEBD" opacity="0.3"/>
      <circle cx="30" cy="28" r="3" fill="#00AEBD" opacity="0.2"/>
      <path d="M12 22H20L22 18H36L34 22" stroke="#070a14" stroke-width="2" fill="#1a1a2e" opacity="0.85"/>
      <rect x="13" y="18" width="7" height="4" rx="1" fill="#1a1a2e" opacity="0.8"/>
      <rect x="22" y="18" width="13" height="4" rx="1" fill="#1a1a2e" opacity="0.8"/>
      <line x1="16" y1="20" x2="17" y2="20" stroke="#7928CA" stroke-width="1.5"/>
      <line x1="26" y1="20" x2="32" y2="20" stroke="#00f2fe" stroke-width="1.5" opacity="0.6"/>
      <path d="M19 33C21 35 27 35 29 33" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="14" cy="30" r="2" fill="#FF69B4" opacity="0.2"/>
      <circle cx="34" cy="30" r="2" fill="#FF69B4" opacity="0.2"/>
    </svg>`
  },

  orbitStar: {
    name: 'orbitStar',
    label: 'Shooting Star',
    svg: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="star-g" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <path d="M34 8L36 14H42L37 18L39 24L34 20L29 24L31 18L26 14H32L34 8Z" fill="url(#star-g)"/>
      <line x1="30" y1="20" x2="6" y2="42" stroke="url(#star-g)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <line x1="28" y1="22" x2="10" y2="38" stroke="#00f2fe" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      <line x1="32" y1="22" x2="16" y2="36" stroke="#FFD93D" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
      <circle cx="34" cy="16" r="6" fill="#FFD93D" opacity="0.15"/>
      <circle cx="10" cy="38" r="2" fill="#00f2fe" opacity="0.4"/>
      <circle cx="6" cy="42" r="1.5" fill="#00f2fe" opacity="0.3"/>
      <circle cx="18" cy="32" r="1" fill="#FFD93D" opacity="0.5"/>
      <circle cx="22" cy="28" r="0.8" fill="#fff" opacity="0.6"/>
    </svg>`
  }
};

/** Get emote SVG by name */
export function getEmoteSvg(name) {
  return OrbitEmotes[name]?.svg || '';
}

/** Get all preset emotes as array */
export function getAllPresets() {
  return Object.values(OrbitEmotes);
}

/**
 * Render a Saturn ring avatar wrapper for live channel profile pictures.
 * @param {Object} opts
 * @param {string} opts.src - Profile picture URL
 * @param {string} opts.fallback - Fallback letter
 * @param {string} opts.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @returns {string} HTML string
 */
export function renderSaturnAvatar({ src, fallback = '?', size = 'md' }) {
  const fontSize = size === 'sm' ? '12' : size === 'lg' ? '20' : size === 'xl' ? '28' : '15';
  const inner = src
    ? `<img src="${src}" alt="" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" /><span class="avatar-fallback" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:${fontSize}px;color:var(--color-cyan-neon);">${fallback}</span>`
    : `<span class="avatar-fallback" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:${fontSize}px;color:var(--color-cyan-neon);">${fallback}</span>`;

  return `
    <div class="orbit-saturn-avatar saturn-${size}">
      <div class="avatar-planet">${inner}</div>
      <div class="saturn-ring"></div>
      <div class="saturn-ring-2"></div>
      <div class="saturn-moon"></div>
    </div>
  `;
}
