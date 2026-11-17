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

  const hairBack = () => {
    if (hair.id === 'ponytail') {
      return <ellipse cx="146" cy="112" rx="17" ry="30" fill={hair.color} />;
    }
    if (hair.id === 'bun') {
      return <circle cx="100" cy="36" r="17" fill={hair.color} />;
    }
    return null;
  };

  const hairFront = () => {
    if (hair.id === 'none') return null;
    if (hair.id === 'bob') {
      return (
        <path
          d="M54 88 C54 46 76 32 100 32 C124 32 146 46 146 88 L146 116 C139 106 137 82 135 72 C120 90 80 90 65 72 C63 82 61 106 54 116 Z"
          fill={hair.color}
        />
      );
    }
    if (hair.id === 'ponytail') {
      return <path d="M56 88 C56 48 76 34 100 34 C124 34 144 48 144 88 C130 70 70 70 56 88 Z" fill={hair.color} />;
    }
    if (hair.id === 'short') {
      return <path d="M58 82 C60 48 78 36 100 36 C122 36 140 48 142 82 C126 66 74 66 58 82 Z" fill={hair.color} />;
    }
    if (hair.id === 'bun') {
      return <path d="M58 82 C60 48 78 36 100 36 C122 36 140 48 142 82 C126 66 74 66 58 82 Z" fill={hair.color} />;
    }
    return (
      <path
        d="M54 86 C54 46 76 32 100 32 C124 32 146 46 146 86 C142 78 136 74 130 72 C124 82 116 84 110 74 C102 86 92 84 86 74 C78 84 68 80 62 72 C58 76 56 80 54 86 Z"
        fill={hair.color}
      />
    );
  };

  const accessoryNode = () => {
    if (accessory === 'glasses') {
      return (
        <g stroke="#5A4A43" strokeWidth="2.6" fill="none">
          <circle cx="84" cy="92" r="11" />
          <circle cx="116" cy="92" r="11" />
          <path d="M95 92 Q100 88 105 92" />
        </g>
      );
    }
    if (accessory === 'bow') {
      return (
        <g transform="translate(146 62) rotate(16)">
          <path d="M0 0 L-18 -10 L-18 10 Z" fill="#FF7A93" />
          <path d="M0 0 L18 -10 L18 10 Z" fill="#FF7A93" />
          <circle cx="0" cy="0" r="4" fill="#FFB3C2" />
        </g>
      );
    }
    if (accessory === 'hat') {
      return (
        <g>
          <path d="M58 52 Q100 12 142 52 Z" fill="#FFD45E" />
          <rect x="52" y="50" width="96" height="8" rx="4" fill="#F5BE42" />
        </g>
      );
    }
    if (accessory === 'hairpin') {
      return <rect x="126" y="62" width="20" height="6" rx="3" transform="rotate(-24 136 65)" fill="#7FD1B9" />;
    }
    if (accessory === 'earrings') {
      return (
        <g fill="#FFD45E">
          <circle cx="55" cy="104" r="4" />
          <circle cx="145" cy="104" r="4" />
        </g>
      );
    }
    return null;
  };

  const actionNode = () => {
    if (action === 'sparkle') {
      return (
        <g fill="#FFC93C">
          <path d="M28 54 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" />
          <path d="M170 78 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
          <circle cx="40" cy="140" r="3" />
        </g>
      );
    }
    if (action === 'blush') {
      return (
        <g fill="#FF9B9B" opacity="0.55">
          <ellipse cx="70" cy="108" rx="10" ry="6" />
          <ellipse cx="130" cy="108" rx="10" ry="6" />
        </g>
      );
    }
    if (action === 'sleepy') {
      return (
        <g fill="#8E7C74" fontSize="16" fontWeight="700">
          <text x="152" y="64">z</text>
          <text x="164" y="48" fontSize="12">z</text>
        </g>
      );
    }
    if (action === 'wave') {
      return (
        <g>
          <circle cx="158" cy="150" r="12" fill={skin.color} />
          <path d="M150 160 Q138 168 132 158" stroke={outfit.color} strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    return null;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      className={className}
      role="img"
      aria-label={`${config.name || '分身'}的形象`}
    >
      <defs>
        <linearGradient id={`bg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={background.from} />
          <stop offset="100%" stopColor={background.to} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="220" rx="24" fill={`url(#bg-${gid})`} />
      <circle cx="168" cy="40" r="16" fill="#FFFFFF" opacity="0.55" />
      <ellipse cx="100" cy="210" rx="66" ry="8" fill="#000000" opacity="0.06" />
      {hairBack()}
      <path d="M58 206 C58 164 76 144 100 144 C124 144 142 164 142 206 Z" fill={outfit.color} />
      <path d="M84 146 Q100 164 116 146" stroke={outfit.accent} strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="92" rx={face.rx} ry={face.ry} fill={skin.color} />
      {hairFront()}
      <ellipse cx="84" cy="92" rx="4" ry="5.5" fill="#4A3B35" />
      <ellipse cx="116" cy="92" rx="4" ry="5.5" fill="#4A3B35" />
      <circle cx="85" cy="90" r="1.4" fill="#FFFFFF" />
      <circle cx="117" cy="90" r="1.4" fill="#FFFFFF" />
      <path d="M90 112 Q100 123 110 112" stroke="#A85A55" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {accessoryNode()}
      {actionNode()}
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
