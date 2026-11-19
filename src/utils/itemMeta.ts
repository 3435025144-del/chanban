import type { IconName } from '../components/Icon';
import {
  accessoryOptions,
  actionOptions,
  backgroundOptions,
  bottomOptions,
  hairOptions,
  outfitOptions,
  shoesOptions,
} from '../data/avatarOptions';
import { findItem, lookPresets } from '../data/blindBoxItems';
import type { AvatarConfig, BlindBoxItemType } from '../types';

export type EquipField =
  | 'outfit'
  | 'hair'
  | 'accessory'
  | 'background'
  | 'action'
  | 'bottom'
  | 'shoes';

export interface ItemMeta {
  id: string;
  name: string;
  type: BlindBoxItemType;
  field?: EquipField;
  emoji: string;
  icon: IconName;
  desc: string;
  rarity: 'common' | 'rare' | 'epic';
  series: string;
}

const fieldIcons: Record<EquipField, IconName> = {
  outfit: 'shirt',
  hair: 'palette',
  accessory: 'sparkle',
  background: 'palette',
  action: 'sparkle',
  bottom: 'hanger',
  shoes: 'walk',
};

const categoryMeta: Record<Exclude<BlindBoxItemType, 'look'>, { name: string; icon: IconName }> = {
  outfit: { name: '上装', icon: 'shirt' },
  hair: { name: '发型', icon: 'palette' },
  accessory: { name: '配饰', icon: 'sparkle' },
  background: { name: '场景', icon: 'palette' },
  action: { name: '动作', icon: 'sparkle' },
  bottom: { name: '下装', icon: 'hanger' },
  shoes: { name: '鞋子', icon: 'walk' },
};

export function equipFieldOf(type: BlindBoxItemType): EquipField | undefined {
  return type === 'look' ? undefined : type;
}

export function itemMeta(id: string): ItemMeta {
  const item = findItem(id);
  if (item) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      field: equipFieldOf(item.type),
      emoji: item.emoji,
      icon: item.type === 'look' ? 'hanger' : fieldIcons[item.type],
      desc: item.desc,
      rarity: item.rarity,
      series: item.series,
    };
  }
  if (id === 'hoodie' || id === 'sports' || id === 'dress') {
    const option = outfitOptions.find((o) => o.id === id);
    return {
      id,
      name: option?.label ?? id,
      type: 'outfit',
      field: 'outfit',
      emoji: '👕',
      icon: 'shirt',
      desc: '成长奖励解锁的基础款。',
      rarity: 'rare',
      series: '成长',
    };
  }
  return {
    id,
    name: id,
    type: 'outfit',
    field: 'outfit',
    emoji: '🎁',
    icon: 'gift',
    desc: '分身的小礼物。',
    rarity: 'common',
    series: '其他',
  };
}

export function typeLabel(type: BlindBoxItemType): string {
  return type === 'look' ? '整套' : categoryMeta[type].name;
}

export function typeIcon(type: BlindBoxItemType): IconName {
  return type === 'look' ? 'hanger' : categoryMeta[type].icon;
}

export function lookConfigFor(id: string): Partial<AvatarConfig> | undefined {
  return lookPresets.find((look) => look.id === id)?.config;
}

export function isLookItem(id: string): boolean {
  return findItem(id)?.type === 'look';
}
