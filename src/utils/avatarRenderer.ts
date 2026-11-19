import {
  accessoryOptions,
  backgroundOptions,
  bottomOptions,
  faceOptions,
  hairOptions,
  outfitOptions,
  shoesOptions,
  skinOptions,
} from '../data/avatarOptions';
import type { AvatarConfig } from '../types';

const INK = '#5B4035';
const INK_SOFT = '#80665A';
const EYE = '#62A96C';
const BLUSH = '#F19A9C';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hairBack(config: AvatarConfig, color: string | null): string {
  if (!color) return '';
  if (config.hair === 'ponytail') {
    return `
      <path d="M151 54 C176 51 185 65 180 83 C176 99 169 112 174 132 C177 145 168 151 160 142 C151 131 159 113 157 100 C155 87 146 77 151 54Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M91 43 C72 54 69 82 74 116 C76 127 87 128 89 116 L96 72Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="120" cy="76" r="43" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
    `;
  }
  if (config.hair === 'bun') {
    return `
      <circle cx="120" cy="31" r="21" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
      <path d="M80 68 C80 42 96 30 120 30 C144 30 160 42 160 68 L157 108 C151 119 143 119 139 106 L101 106 C97 119 89 119 83 108Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
    `;
  }
  if (config.hair === 'short') {
    return `<path d="M80 72 C80 44 96 30 120 30 C144 30 160 44 160 72 L155 94 C146 99 142 91 140 82 L100 82 C98 91 94 99 85 94Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>`;
  }
  if (config.hair === 'wavy') {
    return `
      <path d="M80 65 C78 38 97 27 120 27 C144 27 163 40 161 67 L166 82 C172 89 164 98 156 95 L161 111 C166 120 156 128 149 120 L151 135 C153 146 139 149 136 137 L128 108 L112 108 L104 137 C101 149 87 146 89 135 L91 120 C84 128 74 120 79 111 L84 95 C76 98 68 89 74 82Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
    `;
  }
  return `
    <path d="M80 66 C80 41 97 29 120 29 C143 29 160 41 160 66 L158 106 C155 121 146 126 138 112 L102 112 C94 126 85 121 82 106Z" fill="${color}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M84 83 C72 88 70 103 76 116 C80 126 91 124 92 114Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M156 83 C168 88 170 103 164 116 C160 126 149 124 148 114Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
  `;
}

function hairFront(config: AvatarConfig, color: string | null): string {
  if (!color) return '';
  if (config.hair === 'ponytail') {
    return `
      <path d="M81 71 C82 44 99 29 120 29 C143 29 158 43 160 69 C149 58 140 53 132 51 C128 68 118 71 109 54 C102 66 94 63 90 51 C87 57 84 63 81 71Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M87 48 C91 33 105 28 118 30 C105 36 99 44 96 58Z" fill="#FFF8ED" opacity=".18"/>
      <path d="M152 48 C167 51 173 60 173 68" fill="none" stroke="#FFF8ED" stroke-width="2" opacity=".28" stroke-linecap="round"/>
    `;
  }
  if (config.hair === 'bun') {
    return `
      <path d="M83 71 C84 45 100 31 120 31 C140 31 157 45 158 70 C146 59 137 55 129 53 C123 67 114 69 107 55 C99 66 91 61 87 54Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M97 42 C108 35 126 35 139 44" fill="none" stroke="#FFF8ED" stroke-width="2" opacity=".22" stroke-linecap="round"/>
    `;
  }
  if (config.hair === 'short') {
    return `
      <path d="M82 70 C83 43 100 31 120 31 C142 31 157 45 159 70 C148 59 141 55 135 53 C128 63 116 67 103 57 C96 64 89 62 86 55Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
    `;
  }
  if (config.hair === 'wavy') {
    return `
      <path d="M82 69 C83 43 99 30 120 30 C142 30 158 44 158 71 C150 58 143 54 136 52 C133 64 124 68 117 57 C110 69 102 66 97 55 C92 62 87 64 82 69Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
      <circle cx="91" cy="76" r="9" fill="${color}" stroke="${INK}" stroke-width="2"/>
      <circle cx="149" cy="76" r="9" fill="${color}" stroke="${INK}" stroke-width="2"/>
    `;
  }
  return `
    <path d="M82 71 C82 43 99 29 120 29 C142 29 158 44 160 71 C151 60 143 55 136 52 C131 66 121 70 114 56 C107 67 99 64 96 53 C91 60 87 65 82 71Z" fill="${color}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M93 41 C105 33 122 32 135 36" fill="none" stroke="#FFF8ED" stroke-width="2.2" opacity=".2" stroke-linecap="round"/>
  `;
}

function outfitNode(
  config: AvatarConfig,
  outfit: { id: string; color: string; accent: string },
  skin: string,
): string {
  const long = ['hoodie', 'sports', 'coat'].includes(outfit.id);
  const sleeve = long
    ? `
      <path d="M92 115 C78 119 71 135 70 157 L87 162 C89 144 96 133 106 126Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M148 115 C162 119 169 135 170 157 L153 162 C151 144 144 133 134 126Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.2"/>
    `
    : `
      <path d="M92 114 C82 118 77 128 78 141 L95 145 C94 132 99 123 106 119Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M148 114 C158 118 163 128 162 141 L145 145 C146 132 141 123 134 119Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.2"/>
    `;
  const torso = `
    <path d="M92 112 C104 104 136 104 148 112 L157 163 C139 174 101 174 83 163Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.4"/>
    <path d="M104 110 C109 121 131 121 136 110" fill="none" stroke="${INK_SOFT}" stroke-width="2"/>
  `;
  let details = '';
  if (outfit.id === 'hoodie') {
    details = `
      <path d="M96 111 C104 102 136 102 144 111 C139 122 130 126 120 125 C110 126 101 122 96 111Z" fill="${outfit.accent}" stroke="${INK}" stroke-width="2"/>
      <path d="M109 125 L111 139 M131 125 L129 139" stroke="${INK_SOFT}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="110" cy="140" r="2.2" fill="${INK_SOFT}"/><circle cx="130" cy="140" r="2.2" fill="${INK_SOFT}"/>
      <path d="M100 148 Q120 143 140 148 L136 160 H104Z" fill="${outfit.accent}" opacity=".75"/>
    `;
  } else if (outfit.id === 'sports') {
    details = `
      <path d="M120 111 L120 168" stroke="#FFF8ED" stroke-width="2.3"/>
      <path d="M84 145 Q120 151 156 145" stroke="${outfit.accent}" stroke-width="5" opacity=".95"/>
      <path d="M101 112 L99 161 M139 112 L141 161" stroke="#FFF8ED" stroke-width="2" opacity=".72"/>
    `;
  } else if (outfit.id === 'dress') {
    details = `
      <path d="M91 116 C82 116 78 128 84 136 C91 144 103 137 100 124Z" fill="${outfit.accent}" stroke="${INK}" stroke-width="2"/>
      <path d="M149 116 C158 116 162 128 156 136 C149 144 137 137 140 124Z" fill="${outfit.accent}" stroke="${INK}" stroke-width="2"/>
      <path d="M103 112 Q120 126 137 112 Q132 139 120 140 Q108 139 103 112Z" fill="#FFF8ED" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(120 134)">
        <path d="M0 0 L-11 -7 L-10 7Z" fill="${outfit.accent}" stroke="${INK}" stroke-width="1.3"/>
        <path d="M0 0 L11 -7 L10 7Z" fill="${outfit.accent}" stroke="${INK}" stroke-width="1.3"/>
        <circle r="3.2" fill="#FFF8ED" stroke="${INK}" stroke-width="1.2"/>
      </g>
      <path d="M84 158 Q120 151 156 158 L163 173 Q120 184 77 173Z" fill="${outfit.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M92 160 Q95 169 89 175 M108 158 Q109 169 104 179 M120 157 V181 M132 158 Q131 169 136 179 M148 160 Q145 169 151 175" stroke="${outfit.accent}" stroke-width="1.5" opacity=".8"/>
    `;
  } else if (outfit.id === 'stripe') {
    details = `
      <path d="M87 126 H153 M85 136 H155 M84 146 H156 M84 156 H156" stroke="${outfit.accent}" stroke-width="4" opacity=".9"/>
      <path d="M104 110 Q120 122 136 110" fill="none" stroke="#FFF8ED" stroke-width="4"/>
    `;
  } else if (outfit.id === 'coat') {
    details = `
      <path d="M105 110 Q120 122 135 110 L142 166 L120 158 L98 166Z" fill="#FFF8ED" stroke="${INK}" stroke-width="1.8"/>
      <path d="M104 111 L119 130 L96 160 M136 111 L121 130 L144 160" fill="none" stroke="${outfit.accent}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="120" cy="141" r="2.2" fill="${INK_SOFT}"/>
      <circle cx="120" cy="151" r="2.2" fill="${INK_SOFT}"/>
    `;
  } else {
    details = `
      <path d="M104 110 C109 122 131 122 136 110" fill="none" stroke="${outfit.accent}" stroke-width="4"/>
      <circle cx="120" cy="143" r="10" fill="${outfit.accent}" opacity=".9"/>
      <path d="M114 143 Q120 148 126 143" fill="none" stroke="${INK_SOFT}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="117" cy="141" r="1.3" fill="${INK_SOFT}"/><circle cx="123" cy="141" r="1.3" fill="${INK_SOFT}"/>
    `;
  }
  return `${sleeve}${torso}${details}<circle cx="68" cy="159" r="7.5" fill="${skin}" stroke="${INK}" stroke-width="2"/><circle cx="172" cy="159" r="7.5" fill="${skin}" stroke="${INK}" stroke-width="2"/>`;
}

function bottomNode(bottom: { id: string; color: string; accent: string }, skin: string): string {
  if (bottom.id === 'pantsLinen') {
    return `
      <path d="M95 158 C105 152 136 152 145 158 L142 210 L123 210 L120 174 L116 210 L98 210Z" fill="${bottom.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M101 169 L139 169 M120 159 V210" stroke="${bottom.accent}" stroke-width="5" opacity=".85"/>
    `;
  }
  if (bottom.id === 'skirtDenim') {
    return `
      <path d="M101 162 L114 162 L117 208 L103 208Z" fill="${skin}" stroke="${INK}" stroke-width="2"/>
      <path d="M126 162 L139 162 L137 208 L123 208Z" fill="${skin}" stroke="${INK}" stroke-width="2"/>
      <path d="M94 151 Q120 145 146 151 L163 183 Q120 193 77 183Z" fill="${bottom.color}" stroke="${INK}" stroke-width="2.3"/>
      <path d="M91 174 Q120 181 149 174" fill="none" stroke="${bottom.accent}" stroke-width="2"/>
      <path d="M101 157 L95 181 M120 154 V185 M139 157 L145 181" stroke="${bottom.accent}" stroke-width="1.5" opacity=".9"/>
    `;
  }
  const mix = bottom.id === 'shortsMix';
  return `
    <path d="M101 162 L114 162 L117 208 L103 208Z" fill="${skin}" stroke="${INK}" stroke-width="2"/>
    <path d="M126 162 L139 162 L137 208 L123 208Z" fill="${skin}" stroke="${INK}" stroke-width="2"/>
    <path d="M94 151 Q120 145 146 151 L146 180 L123 182 L120 166 L116 182 L94 180Z" fill="${bottom.color}" stroke="${INK}" stroke-width="2.3"/>
    <path d="M96 159 H144" stroke="${bottom.accent}" stroke-width="5" opacity=".9"/>
    ${mix ? `<path d="M120 151 V181" stroke="${bottom.accent}" stroke-width="7"/>` : `<path d="M120 152 V181" stroke="${bottom.accent}" stroke-width="2"/>`}
  `;
}

function shoesNode(shoe: { id: string; color: string; accent: string }, skin: string): string {
  if (shoe.id === 'boots') {
    return `
      <path d="M100 198 H117 L119 221 Q107 228 96 221Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M123 198 H140 L144 221 Q133 228 121 221Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M99 207 H118 M122 207 H141" stroke="${shoe.accent}" stroke-width="3"/>
    `;
  }
  if (shoe.id === 'sandals') {
    return `
      <path d="M99 209 Q108 205 117 213 L116 219 Q105 224 98 218Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2"/>
      <path d="M123 213 Q132 205 141 209 L143 218 Q136 224 124 219Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2"/>
      <path d="M101 212 L113 216 M127 216 L139 212" stroke="${shoe.accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M111 210 L108 215 M130 215 L133 210" stroke="${skin}" stroke-width="2"/>
    `;
  }
  return `
    <path d="M100 204 Q108 198 117 205 L118 219 Q105 225 97 218Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M123 205 Q132 198 140 204 L143 218 Q135 225 122 219Z" fill="${shoe.color}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M101 215 Q109 212 117 216 M123 216 Q131 212 139 215" stroke="${shoe.accent}" stroke-width="3" stroke-linecap="round"/>
  `;
}

function accessoryNode(config: AvatarConfig): string {
  if (config.accessory === 'glasses') {
    return `
      <g fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2">
        <rect x="94" y="71" width="22" height="16" rx="7"/>
        <rect x="124" y="71" width="22" height="16" rx="7"/>
        <path d="M116 78 H124" fill="none"/>
      </g>
    `;
  }
  if (config.accessory === 'bow') {
    return `
      <g transform="translate(151 45) rotate(12)" stroke="${INK}" stroke-width="1.8">
        <path d="M0 0 L-16 -10 L-15 10Z" fill="#F28EAA"/>
        <path d="M0 0 L16 -10 L15 10Z" fill="#F28EAA"/>
        <circle r="4" fill="#FFD7E1"/>
      </g>
    `;
  }
  if (config.accessory === 'hat') {
    return `
      <path d="M83 48 C91 17 146 15 158 47Z" fill="#F3CA55" stroke="${INK}" stroke-width="2.2"/>
      <path d="M77 48 Q120 40 164 48 L166 56 Q120 49 75 56Z" fill="#E6B83D" stroke="${INK}" stroke-width="2"/>
    `;
  }
  if (config.accessory === 'hairpin') {
    return `<path d="M139 47 L159 41 L161 48 L141 54Z" fill="#74C8BA" stroke="${INK}" stroke-width="1.6"/><circle cx="159" cy="44" r="4" fill="#FFE08B" stroke="${INK}" stroke-width="1.2"/>`;
  }
  if (config.accessory === 'earrings') {
    return `<circle cx="83" cy="87" r="3.5" fill="#F4C95D" stroke="${INK}" stroke-width="1.2"/><circle cx="157" cy="87" r="3.5" fill="#F4C95D" stroke="${INK}" stroke-width="1.2"/>`;
  }
  return '';
}

function actionNode(config: AvatarConfig): string {
  if (config.action === 'sparkle') {
    return `
      <g fill="#F0BF46" stroke="${INK}" stroke-width=".8">
        <path d="M42 78 l4 9 9 4 -9 4 -4 9 -4-9 -9-4 9-4Z"/>
        <path d="M194 121 l3 7 7 3 -7 3 -3 7 -3-7 -7-3 7-3Z"/>
        <circle cx="51" cy="167" r="3"/>
      </g>
    `;
  }
  if (config.action === 'sleepy') {
    return `<g fill="${INK_SOFT}" font-family="sans-serif" font-weight="700"><text x="170" y="54" font-size="14">z</text><text x="182" y="42" font-size="10">z</text></g>`;
  }
  if (config.action === 'blush') {
    return `<g fill="${BLUSH}" opacity=".55"><ellipse cx="100" cy="91" rx="9" ry="4"/><ellipse cx="140" cy="91" rx="9" ry="4"/></g>`;
  }
  if (config.action === 'wave') {
    return `<path d="M178 102 l7 -8 M177 91 l4 -8 M170 84 l1 -8" stroke="${INK_SOFT}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return '';
}

export function renderAvatarSvg(config: AvatarConfig, size: number | string = 180, className = ''): string {
  const face = faceOptions.find((item) => item.id === config.face) ?? faceOptions[0];
  const hair = hairOptions.find((item) => item.id === config.hair) ?? hairOptions[0];
  const skin = skinOptions.find((item) => item.id === config.skin) ?? skinOptions[2];
  const outfit = outfitOptions.find((item) => item.id === config.outfit) ?? outfitOptions[0];
  const bottom = bottomOptions.find((item) => item.id === config.bottom) ?? bottomOptions[0];
  const shoe = shoesOptions.find((item) => item.id === config.shoes) ?? shoesOptions[0];
  const background = backgroundOptions.find((item) => item.id === config.background) ?? backgroundOptions[0];
  const hairColor = hair.color === 'transparent' ? null : hair.color;
  const headRx = 35 * (face.rx / 47);
  const headRy = 34 * (face.ry / 49);
  const wave = config.action === 'wave';
  const gradientId = `avatar-bg-${background.id}-${background.from.replace('#', '')}-${background.to.replace('#', '')}`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" class="${escapeXml(className)}" role="img" aria-label="${escapeXml(`${config.name || '分身'}的全身形象`)}">
      <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${background.from}"/><stop offset="1" stop-color="${background.to}"/></linearGradient></defs>
      <rect width="240" height="240" fill="url(#${gradientId})"/>
      <ellipse cx="120" cy="219" rx="60" ry="8" fill="${INK}" opacity=".12"/>
      ${hairBack(config, hairColor)}
      <path d="M101 162 L114 162 L117 207 L103 207Z" fill="${skin.color}" stroke="${INK}" stroke-width="2"/>
      <path d="M126 162 L139 162 L137 207 L123 207Z" fill="${skin.color}" stroke="${INK}" stroke-width="2"/>
      ${bottomNode(bottom, skin.color)}
      ${shoesNode(shoe, skin.color)}
      <path d="M92 116 C75 ${wave ? 99 : 124} 71 140 69 157" fill="none" stroke="${skin.color}" stroke-width="13" stroke-linecap="round"/>
      <path d="M148 116 C${wave ? '171 106 178 94 180 89' : '165 124 169 140 171 157'}" fill="none" stroke="${skin.color}" stroke-width="13" stroke-linecap="round"/>
      ${outfitNode(config, outfit, skin.color)}
      <rect x="111" y="101" width="18" height="17" rx="7" fill="${skin.color}" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="${120 - headRx}" cy="82" rx="7" ry="10" fill="${skin.color}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="${120 + headRx}" cy="82" rx="7" ry="10" fill="${skin.color}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="120" cy="78" rx="${headRx}" ry="${headRy}" fill="${skin.color}" stroke="${INK}" stroke-width="2.4"/>
      ${hairFront(config, hairColor)}
      <path d="M98 77 Q104 72 110 77 M130 77 Q136 72 142 77" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="106" cy="82" rx="7.3" ry="9.2" fill="#FFFDF8" stroke="${INK}" stroke-width="1.6"/>
      <ellipse cx="134" cy="82" rx="7.3" ry="9.2" fill="#FFFDF8" stroke="${INK}" stroke-width="1.6"/>
      <ellipse cx="107" cy="83" rx="5" ry="6.8" fill="${EYE}"/>
      <ellipse cx="135" cy="83" rx="5" ry="6.8" fill="${EYE}"/>
      <ellipse cx="107" cy="84" rx="2.7" ry="4.6" fill="#314B3B"/>
      <ellipse cx="135" cy="84" rx="2.7" ry="4.6" fill="#314B3B"/>
      <circle cx="108.7" cy="80.6" r="1.8" fill="#FFFFFF"/><circle cx="136.7" cy="80.6" r="1.8" fill="#FFFFFF"/>
      <circle cx="109.8" cy="86.7" r=".9" fill="#FFFFFF" opacity=".8"/><circle cx="137.8" cy="86.7" r=".9" fill="#FFFFFF" opacity=".8"/>
      <path d="M100 78 Q106 75 112 78 M128 78 Q134 75 140 78" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M116 93 Q120 97 124 93" fill="none" stroke="#A95551" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="98" cy="91" rx="6" ry="3.2" fill="${BLUSH}" opacity=".45"/>
      <ellipse cx="142" cy="91" rx="6" ry="3.2" fill="${BLUSH}" opacity=".45"/>
      ${accessoryNode(config)}
      ${actionNode(config)}
    </svg>
  `;
}
