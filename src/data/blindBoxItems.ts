import {
  accessoryOptions,
  actionOptions,
  backgroundOptions,
  bottomOptions,
  hairOptions,
  outfitOptions,
  shoesOptions,
} from './avatarOptions';
import type { AvatarConfig, BlindBoxItemType, BlindBoxPool } from '../types';

export interface BlindBoxItem {
  id: string;
  name: string;
  type: BlindBoxItemType;
  pool: BlindBoxPool;
  rarity: 'common' | 'rare' | 'epic';
  emoji: string;
  desc: string;
  series: string;
  source: '星盒抽取' | '碎片兑换' | '成长奖励';
}

const baseBlindBoxItems: BlindBoxItem[] = [
  { id: 'ponytail', name: '元气马尾', type: 'hair', pool: 'normal', rarity: 'common', emoji: '🎀', desc: '跑起来会甩呀甩的发型。', series: '日常', source: '星盒抽取' },
  { id: 'stripe', name: '海盐条纹衫', type: 'outfit', pool: 'normal', rarity: 'common', emoji: '👕', desc: '像海风一样清爽的日常款。', series: '日常', source: '星盒抽取' },
  { id: 'glasses', name: '圆框眼镜', type: 'accessory', pool: 'normal', rarity: 'common', emoji: '👓', desc: '戴上立刻显得很有学问。', series: '日常', source: '星盒抽取' },
  { id: 'mint', name: '薄荷小院', type: 'background', pool: 'normal', rarity: 'common', emoji: '🌿', desc: '空气里都是凉凉的草香。', series: '日常', source: '星盒抽取' },
  { id: 'sparkle', name: '闪闪发光', type: 'action', pool: 'normal', rarity: 'rare', emoji: '✨', desc: '今天你就是全场最亮。', series: '日常', source: '星盒抽取' },
  { id: 'bow', name: '草莓蝴蝶结', type: 'accessory', pool: 'normal', rarity: 'common', emoji: '🎀', desc: '别在头发上刚刚好。', series: '草莓日', source: '星盒抽取' },
  { id: 'bun', name: '软乎乎丸子头', type: 'hair', pool: 'normal', rarity: 'common', emoji: '🍡', desc: '看起来很好捏的样子。', series: '日常', source: '星盒抽取' },
  { id: 'sunset', name: '橘子晚霞', type: 'background', pool: 'normal', rarity: 'rare', emoji: '🌇', desc: '把黄昏装进相框里。', series: '慢享', source: '星盒抽取' },
  { id: 'coat', name: '焦糖小外套', type: 'outfit', pool: 'normal', rarity: 'rare', emoji: '🧥', desc: '秋天第一件想穿的外套。', series: '慢享', source: '星盒抽取' },
  { id: 'wave', name: '挥挥手', type: 'action', pool: 'normal', rarity: 'common', emoji: '👋', desc: '和今天的自己打个招呼。', series: '日常', source: '星盒抽取' },
  { id: 'shortsMix', name: '拼色短裤', type: 'bottom', pool: 'normal', rarity: 'common', emoji: '🩳', desc: ' Mild Day 灵感拼色。', series: '慢享', source: '星盒抽取' },
  { id: 'sneaker', name: '奶白球鞋', type: 'shoes', pool: 'normal', rarity: 'common', emoji: '👟', desc: '走多远都舒服。', series: '日常', source: '星盒抽取' },
  { id: 'shortsNavy', name: '深蓝短裤', type: 'bottom', pool: 'normal', rarity: 'common', emoji: '🩳', desc: '干净利落的深蓝。', series: '慢享', source: '星盒抽取' },
  { id: 'boots', name: '奶油短靴', type: 'shoes', pool: 'normal', rarity: 'rare', emoji: '🥾', desc: '适合散步的轻轻一小双。', series: '慢享', source: '星盒抽取' },

  { id: 'hat', name: '柠檬小黄帽', type: 'accessory', pool: 'limited', rarity: 'rare', emoji: '👒', desc: '限定款，阳光加倍。', series: '慢享', source: '星盒抽取' },
  { id: 'night', name: '星星夜空', type: 'background', pool: 'limited', rarity: 'epic', emoji: '🌙', desc: '限定款，适合数羊。', series: '夜色', source: '星盒抽取' },
  { id: 'blush', name: '害羞脸红', type: 'action', pool: 'limited', rarity: 'rare', emoji: '😊', desc: '限定款，被夸之后的反应。', series: '日常', source: '星盒抽取' },
  { id: 'wavy', name: '云朵小卷发', type: 'hair', pool: 'limited', rarity: 'epic', emoji: '☁️', desc: '限定款，蓬松得像云。', series: '慢享', source: '星盒抽取' },
  { id: 'earrings', name: '珍珠小耳环', type: 'accessory', pool: 'limited', rarity: 'rare', emoji: '💎', desc: '限定款，闪闪但不夸张。', series: '夜色', source: '星盒抽取' },
  { id: 'cloud', name: '棉花糖云端', type: 'background', pool: 'limited', rarity: 'epic', emoji: '☁️', desc: '限定款，踩上去软软的。', series: '夜色', source: '星盒抽取' },
  { id: 'lookLazy', name: '慵懒出门', type: 'look', pool: 'limited', rarity: 'epic', emoji: '🧺', desc: '一整套穿好就出门。', series: '慢享', source: '星盒抽取' },
  { id: 'lookBerry', name: '莓果散步', type: 'look', pool: 'limited', rarity: 'epic', emoji: '🍓', desc: '粉粉嫩嫩的一身。', series: '草莓日', source: '星盒抽取' },
];

const wardrobeSources: { options: { id: string; label: string }[]; type: BlindBoxItemType; emoji: string }[] = [
  { options: outfitOptions, type: 'outfit', emoji: '👕' },
  { options: bottomOptions, type: 'bottom', emoji: '🩳' },
  { options: shoesOptions, type: 'shoes', emoji: '👟' },
  { options: hairOptions.filter((option) => option.id !== 'none'), type: 'hair', emoji: '💇' },
  { options: accessoryOptions.filter((option) => option.id !== 'none'), type: 'accessory', emoji: '🎀' },
  { options: backgroundOptions, type: 'background', emoji: '🌈' },
  { options: actionOptions.filter((option) => option.id !== 'none'), type: 'action', emoji: '✨' },
];

const generatedBlindBoxItems: BlindBoxItem[] = wardrobeSources.flatMap(({ options, type, emoji }) =>
  options.map((option) => ({
    id: option.id,
    name: option.label,
    type,
    pool: 'normal',
    rarity: 'common',
    emoji,
    desc: `星星盒里的小惊喜：${option.label}。`,
    series: '衣柜',
    source: '星盒抽取',
  })),
);

const baseIds = new Set(baseBlindBoxItems.map((item) => item.id));

export const blindBoxItems: BlindBoxItem[] = [
  ...baseBlindBoxItems,
  ...generatedBlindBoxItems.filter((item) => !baseIds.has(item.id)),
];

export interface LookPreset {
  id: string;
  name: string;
  config: Partial<AvatarConfig>;
}

export const lookPresets: LookPreset[] = [
  { id: 'lookLazy', name: '慵懒出门', config: { outfit: 'hoodie', bottom: 'shortsMix', shoes: 'sneaker', accessory: 'none', background: 'sunny' } },
  { id: 'lookBerry', name: '莓果散步', config: { outfit: 'dress', bottom: 'shortsNavy', shoes: 'boots', accessory: 'bow', background: 'sunset' } },
  { id: 'lookCoffee', name: '咖啡小憩', config: { outfit: 'coat', bottom: 'shortsNavy', shoes: 'boots', accessory: 'glasses', background: 'mint' } },
];

export interface MilestoneDef {
  id: string;
  title: string;
  target: number;
  rewardItemId: string;
  rewardName: string;
  metric: 'meals' | 'streak' | 'resisted';
}

export const milestones: MilestoneDef[] = [
  { id: 'm50', title: '累计记录 50 餐', target: 50, rewardItemId: 'hoodie', rewardName: '慵懒连帽衫', metric: 'meals' },
  { id: 'm14', title: '连续记录 14 天', target: 14, rewardItemId: 'sports', rewardName: '元气运动服', metric: 'streak' },
  { id: 'm20', title: '扛馋成功 20 次', target: 20, rewardItemId: 'dress', rewardName: '草莓小裙子', metric: 'resisted' },
];

export function findItem(id: string): BlindBoxItem | undefined {
  return blindBoxItems.find((item) => item.id === id);
}

export function itemsInPool(pool: BlindBoxPool): BlindBoxItem[] {
  return blindBoxItems.filter((item) => item.pool === pool);
}
