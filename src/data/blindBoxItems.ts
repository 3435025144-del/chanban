import type { BlindBoxItemType, BlindBoxPool } from '../types';

export interface BlindBoxItem {
  id: string;
  name: string;
  type: BlindBoxItemType;
  pool: BlindBoxPool;
  rarity: 'common' | 'rare' | 'epic';
  emoji: string;
  desc: string;
}

export const blindBoxItems: BlindBoxItem[] = [
  { id: 'ponytail', name: '元气马尾', type: 'hair', pool: 'normal', rarity: 'common', emoji: '🎀', desc: '跑起来会甩呀甩的发型。' },
  { id: 'stripe', name: '海盐条纹衫', type: 'outfit', pool: 'normal', rarity: 'common', emoji: '👕', desc: '像海风一样清爽的日常款。' },
  { id: 'glasses', name: '圆框眼镜', type: 'accessory', pool: 'normal', rarity: 'common', emoji: '👓', desc: '戴上立刻显得很有学问。' },
  { id: 'mint', name: '薄荷小院', type: 'background', pool: 'normal', rarity: 'common', emoji: '🌿', desc: '空气里都是凉凉的草香。' },
  { id: 'sparkle', name: '闪闪发光', type: 'action', pool: 'normal', rarity: 'rare', emoji: '✨', desc: '今天你就是全场最亮。' },
  { id: 'bow', name: '草莓蝴蝶结', type: 'accessory', pool: 'normal', rarity: 'common', emoji: '🎀', desc: '别在头发上刚刚好。' },
  { id: 'bun', name: '软乎乎丸子头', type: 'hair', pool: 'normal', rarity: 'common', emoji: '🍡', desc: '看起来很好捏的样子。' },
  { id: 'sunset', name: '橘子晚霞', type: 'background', pool: 'normal', rarity: 'rare', emoji: '🌇', desc: '把黄昏装进相框里。' },
  { id: 'coat', name: '焦糖小外套', type: 'outfit', pool: 'normal', rarity: 'rare', emoji: '🧥', desc: '秋天第一件想穿的外套。' },
  { id: 'wave', name: '挥挥手', type: 'action', pool: 'normal', rarity: 'common', emoji: '👋', desc: '和今天的自己打个招呼。' },
  { id: 'hat', name: '柠檬小黄帽', type: 'accessory', pool: 'limited', rarity: 'rare', emoji: '👒', desc: '限定款，阳光加倍。' },
  { id: 'night', name: '星星夜空', type: 'background', pool: 'limited', rarity: 'epic', emoji: '🌙', desc: '限定款，适合数羊。' },
  { id: 'blush', name: '害羞脸红', type: 'action', pool: 'limited', rarity: 'rare', emoji: '😊', desc: '限定款，被夸之后的反应。' },
  { id: 'wavy', name: '云朵小卷发', type: 'hair', pool: 'limited', rarity: 'epic', emoji: '☁️', desc: '限定款，蓬松得像云。' },
  { id: 'earrings', name: '珍珠小耳环', type: 'accessory', pool: 'limited', rarity: 'rare', emoji: '💎', desc: '限定款，闪闪但不夸张。' },
  { id: 'cloud', name: '棉花糖云端', type: 'background', pool: 'limited', rarity: 'epic', emoji: '☁️', desc: '限定款，踩上去软软的。' },
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
