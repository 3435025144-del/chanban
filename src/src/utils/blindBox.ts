import { itemsInPool } from '../data/blindBoxItems';
import type { BlindBoxPool, DrawResult } from '../types';

const weightOf = (rarity: 'common' | 'rare' | 'epic') => (rarity === 'common' ? 6 : rarity === 'rare' ? 3 : 1);

export function drawItems(owned: string[], pool: BlindBoxPool, count: number): DrawResult[] {
  const bag = itemsInPool(pool).flatMap((item) => Array(weightOf(item.rarity)).fill(item.id));
  const results: DrawResult[] = [];
  const nextOwned = [...owned];
  for (let i = 0; i < count; i++) {
    const itemId = bag[Math.floor(Math.random() * bag.length)];
    const isDuplicate = nextOwned.includes(itemId);
    if (!isDuplicate) nextOwned.push(itemId);
    results.push({ itemId, isDuplicate });
  }
  return results;
}

export const pullCost = (count: 1 | 10) => (count === 1 ? 5 : 45);
