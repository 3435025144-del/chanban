import { renderAvatarSvg } from '../utils/avatarRenderer';
import { outfitOptions, hairOptions, bottomOptions, shoesOptions, accessoryOptions, actionOptions } from '../data/avatarOptions';
import type { AvatarConfig } from '../types';

interface Props {
  config: AvatarConfig;
  size?: number;
  className?: string;
  fill?: boolean;
}

export default function Avatar({ config, size = 180, className = '', fill = false }: Props) {
  return (
    <div
      className={className}
      style={fill
        ? { width: '100%', aspectRatio: '1 / 1', display: 'block' }
        : { width: size, height: size, display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: renderAvatarSvg(config, fill ? '100%' : size) }}
    />
  );
}

export function equippedLabel(config: AvatarConfig): string {
  const hair = hairOptions.find((option) => option.id === config.hair)?.label ?? '默认发型';
  const outfit = outfitOptions.find((option) => option.id === config.outfit)?.label ?? '默认衣服';
  const bottom = bottomOptions.find((option) => option.id === config.bottom)?.label ?? '';
  const shoes = shoesOptions.find((option) => option.id === config.shoes)?.label ?? '';
  const accessory = config.accessory && config.accessory !== 'none'
    ? accessoryOptions.find((option) => option.id === config.accessory)?.label ?? ''
    : '';
  return [outfit, bottom, shoes, hair, accessory].filter(Boolean).join(' · ') || actionOptions[0].label;
}
