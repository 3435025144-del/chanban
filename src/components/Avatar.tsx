import { useId } from 'react';
import {
  accessoryOptions,
  actionOptions,
  backgroundOptions,
  faceOptions,
  hairOptions,
  outfitOptions,
  skinOptions,
} from '../data/avatarOptions';
import type { AvatarConfig } from '../types';

interface Props {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

export default function Avatar({ config, size = 180, className = '' }: Props) {
  const gid = useId().replace(/:/g, '');
  const face = faceOptions.find((o) => o.id === config.face) ?? faceOptions[0];
  const hair = hairOptions.find((o) => o.id === config.hair) ?? hairOptions[0];
  const skin = skinOptions.find((o) => o.id === config.skin) ?? skinOptions[2];
  const outfit = outfitOptions.find((o) => o.id === config.outfit) ?? outfitOptions[0];
  const accessory = config.accessory ?? 'none';
  const background = backgroundOptions.find((o) => o.id === config.background) ?? backgroundOptions[0];
  const action = config.action ?? 'none';

  const headRx = Math.round(face.rx * 0.72);
  const headRy = Math.round(face.ry * 0.66);
  const hairColor = hair.color === 'transparent' ? null : hair.color;

  const hairBack = () => {
    if (!hairColor) return null;
    if (hair.id === 'ponytail') {
      return (
        <g fill={hairColor}>
          <ellipse cx="150" cy="72" rx="15" ry="28" />
          <circle cx="100" cy="66" r="45" />
        </g>
      );
    }
    if (hair.id === 'bun') {
      return (
        <g fill={hairColor}>
          <circle cx="100" cy="30" r="17" />
          <circle cx="100" cy="68" r="45" />
        </g>
      );
    }
    if (hair.id === 'short') {
      return <circle cx="100" cy="68" r="42" fill={hairColor} />;
    }
    return (
      <g fill={hairColor}>
        <circle cx="62" cy="82" r="22" />
        <circle cx="138" cy="82" r="22" />
        <circle cx="100" cy="66" r="46" />
      </g>
    );
  };

  const hairFront = () => {
    if (!hairColor) return null;
    if (hair.id === 'ponytail' || hair.id === 'bun') {
      return <path d="M58 70 C60 38 78 26 100 26 C122 26 140 38 142 70 C128 58 116 54 100 54 C84 54 72 58 58 70 Z" fill={hairColor} />;
    }
    if (hair.id === 'short') {
      return <path d="M60 66 C64 38 80 30 100 30 C120 30 136 38 140 66 C126 54 74 54 60 66 Z" fill={hairColor} />;
    }
    return (
      <path
        d="M56 74 C56 40 76 26 100 26 C124 26 144 40 144 74 C136 60 130 58 122 56 C116 70 108 72 100 58 C92 72 84 70 78 56 C70 58 64 60 56 74 Z"
        fill={hairColor}
      />
    );
  };

  const accessoryNode = () => {
    if (accessory === 'glasses') {
      return (
        <g stroke="#6E5A4F" strokeWidth="2.4" fill="none">
          <circle cx={100 - headRx * 0.45} cy="76" r="10" />
          <circle cx={100 + headRx * 0.45} cy="76" r="10" />
          <path d={`M${100 - headRx * 0.45 + 10} 76 Q100 71 ${100 + headRx * 0.45 - 10} 76`} />
        </g>
      );
    }
    if (accessory === 'bow') {
      return (
        <g transform="translate(130 48) rotate(14)">
          <path d="M0 0 L-17 -9 L-17 9 Z" fill="#FF8FA3" />
          <path d="M0 0 L17 -9 L17 9 Z" fill="#FF8FA3" />
          <circle cx="0" cy="0" r="4" fill="#FFD0D8" />
        </g>
      );
    }
    if (accessory === 'hat') {
      return (
        <g>
          <path d="M62 46 Q100 12 138 46 Z" fill="#FFD86B" />
          <rect x="56" y="44" width="88" height="8" rx="4" fill="#F5C44E" />
        </g>
      );
    }
    if (accessory === 'hairpin') {
      return <rect x="124" y="50" width="18" height="6" rx="3" transform="rotate(-24 133 53)" fill="#8FD4C0" />;
    }
    if (accessory === 'earrings') {
      return (
        <g fill="#FFD86B">
          <circle cx={100 - headRx - 2} cy="88" r="4" />
          <circle cx={100 + headRx + 2} cy="88" r="4" />
        </g>
      );
    }
    return null;
  };

  const actionNode = () => {
    if (action === 'sparkle') {
      return (
        <g fill="#FFD86B">
          <path d="M24 70 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" />
          <path d="M176 96 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
          <circle cx="34" cy="180" r="3" />
        </g>
      );
    }
    if (action === 'sleepy') {
      return (
        <g fill="#8A7A6B" fontSize="15" fontWeight="700">
          <text x="150" y="50">z</text>
          <text x="162" y="38" fontSize="11">z</text>
        </g>
      );
    }
    if (action === 'wave') {
      return (
        <g>
          <circle cx="152" cy="142" r="9" fill={skin.color} />
          <path d="M146 150 Q134 158 128 148" stroke={outfit.color} strokeWidth="9" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    return null;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 260"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={`${config.name || '分身'}的全身形象`}
    >
      <defs>
        <linearGradient id={`bg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={background.from} />
          <stop offset="100%" stopColor={background.to} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="260" rx="28" fill="#FFF9E9" />
      <rect x="0" y="0" width="200" height="260" rx="28" fill={`url(#bg-${gid})`} opacity="0.65" />
      <text x="100" y="24" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="2" fill="#E8B98C" opacity="0.75">
        LAZY DAY
      </text>
      <g opacity="0.5">
        <rect x="8" y="42" width="28" height="38" rx="6" fill="#FFE6A8" transform="rotate(-10 22 61)" />
        <path d="M14 56 L30 48 L36 72 L20 78 Z" fill="#F6C97B" />
        <rect x="166" y="46" width="28" height="34" rx="7" fill="#F7A9A8" transform="rotate(9 180 63)" />
        <circle cx="180" cy="63" r="6" fill="#FFD8D8" />
        <rect x="14" y="188" width="32" height="34" rx="7" fill="#F3A58C" transform="rotate(7 30 205)" />
        <rect x="160" y="188" width="30" height="36" rx="7" fill="#A8C9E8" transform="rotate(-8 175 206)" />
      </g>

      <ellipse cx="100" cy="246" rx="58" ry="7" fill="#7C6A4A" opacity="0.1" />

      {hairBack()}

      <path d="M82 150 L78 224 Q78 232 86 232 L92 232 L96 158 Z" fill={skin.color} />
      <path d="M108 158 L112 232 L119 232 Q127 232 126 224 L120 150 Z" fill={skin.color} />
      <rect x="78" y="214" width="18" height="18" rx="6" fill="#BFE3D8" />
      <rect x="108" y="214" width="18" height="18" rx="6" fill="#BFE3D8" />
      <path d="M78 220 H96 M78 225 H96 M108 220 H126 M108 225 H126" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" />
      <path d="M70 232 Q84 226 98 234 Q101 242 90 244 L68 244 Q62 240 70 232 Z" fill="#D9D5F2" />
      <path d="M106 234 Q120 226 134 232 Q142 240 136 244 L112 244 Q101 242 106 234 Z" fill="#D9D5F2" />
      <path d="M72 236 Q86 232 96 238" stroke="#F4A46D" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M108 238 Q120 232 132 236" stroke="#F4A46D" strokeWidth="4" fill="none" strokeLinecap="round" />

      <path d="M72 158 Q100 150 130 158 L134 190 L112 192 L104 172 L96 192 L70 190 Z" fill="#A7A5D8" />
      <path d="M70 172 L98 174 L96 192 L70 190 Z" fill="#B8D7CF" opacity="0.9" />

      <path d="M70 108 Q100 94 130 108 L146 172 Q100 184 54 172 Z" fill={outfit.color} />
      <path d="M78 100 Q100 86 122 100 Q128 112 116 118 Q100 124 84 118 Q72 112 78 100 Z" fill={outfit.accent} />
      <path d="M84 116 Q100 128 116 116" stroke={outfit.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="142" r="17" fill={outfit.accent} opacity="0.85" />
      <path d="M92 140 Q100 150 108 140" stroke="#8FA6C9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="94" cy="136" r="1.8" fill="#8FA6C9" />
      <circle cx="106" cy="136" r="1.8" fill="#8FA6C9" />

      <path d="M72 112 Q54 120 50 158 Q48 174 60 176 Q70 176 72 164 Z" fill={outfit.color} />
      <path d="M128 112 Q146 120 150 158 Q152 174 140 176 Q130 176 128 164 Z" fill={outfit.color} />
      <circle cx="58" cy="176" r="9" fill={skin.color} />
      <circle cx="142" cy="176" r="9" fill={skin.color} />

      <rect x="92" y="98" width="16" height="16" rx="6" fill={skin.color} />
      <ellipse cx="100" cy="74" rx={headRx} ry={headRy} fill={skin.color} />

      {hairFront()}

      <ellipse cx={100 - headRx * 0.42} cy="76" rx="4.6" ry="6" fill="#4A342E" />
      <ellipse cx={100 + headRx * 0.42} cy="76" rx="4.6" ry="6" fill="#4A342E" />
      <circle cx={100 - headRx * 0.42 + 1.6} cy="74" r="1.5" fill="#FFFFFF" />
      <circle cx={100 + headRx * 0.42 + 1.6} cy="74" r="1.5" fill="#FFFFFF" />
      <path d={`M${100 - 6} 88 Q100 95 ${100 + 6} 88`} stroke="#A85A55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx={100 - headRx * 0.75} cy="86" rx="7" ry="4" fill="#F49A9A" opacity="0.55" />
      <ellipse cx={100 + headRx * 0.75} cy="86" rx="7" ry="4" fill="#F49A9A" opacity="0.55" />

      {accessoryNode()}

      <g>
        <path d="M50 174 Q52 154 68 156" stroke="#D9A8A0" strokeWidth="3" fill="none" />
        <rect x="42" y="172" width="38" height="42" rx="6" fill="#F5B7BE" />
        <text x="61" y="194" textAnchor="middle" fontSize="7" fill="#FFFFFF" fontWeight="700">THANK</text>
        <path d="M132 174 Q134 154 150 156" stroke="#D9A8A0" strokeWidth="3" fill="none" />
        <rect x="122" y="172" width="38" height="42" rx="6" fill="#F5B7BE" />
        <text x="141" y="194" textAnchor="middle" fontSize="7" fill="#FFFFFF" fontWeight="700">YOU</text>
      </g>

      {actionNode()}
      {action === 'blush' && (
        <g fill="#FF7F8F" opacity="0.55">
          <ellipse cx={100 - headRx * 0.75} cy="86" rx="9" ry="5" />
          <ellipse cx={100 + headRx * 0.75} cy="86" rx="9" ry="5" />
        </g>
      )}
    </svg>
  );
}

export function equippedLabel(config: AvatarConfig): string {
  const hair = hairOptions.find((o) => o.id === config.hair)?.label ?? '默认发型';
  const outfit = outfitOptions.find((o) => o.id === config.outfit)?.label ?? '默认衣服';
  const acc = config.accessory && config.accessory !== 'none'
    ? accessoryOptions.find((o) => o.id === config.accessory)?.label ?? ''
    : '';
  return [outfit, hair, acc].filter(Boolean).join(' · ') || actionOptions[0].label;
}
