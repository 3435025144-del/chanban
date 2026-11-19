import type { MealType } from '../types';

export const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  late: '夜宵',
  unknown: '未分类',
};

export const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'late', 'unknown'];

export function getMealByTime(hour = new Date().getHours(), minute = new Date().getMinutes()): MealType {
  const value = hour + minute / 60;
  if (value >= 5 && value <= 10.5) return 'breakfast';
  if (value > 10.5 && value <= 14.5) return 'lunch';
  if (value > 14.5 && value < 17) return 'snack';
  if (value >= 17 && value <= 22) return 'dinner';
  return 'late';
}

export function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function nowDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
