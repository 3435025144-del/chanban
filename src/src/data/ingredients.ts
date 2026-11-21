export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: string;
  kcalPer100g: number;
}

export const ingredients: Ingredient[] = [
  { id: 'chicken', name: '鸡胸肉', emoji: '🍗', category: '蛋白质', kcalPer100g: 133 },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', category: '蛋白质', kcalPer100g: 144 },
  { id: 'shrimp', name: '虾仁', emoji: '🍤', category: '蛋白质', kcalPer100g: 99 },
  { id: 'tofu', name: '嫩豆腐', emoji: '🧈', category: '蛋白质', kcalPer100g: 76 },
  { id: 'beef', name: '瘦牛肉', emoji: '🥩', category: '蛋白质', kcalPer100g: 150 },
  { id: 'salmon', name: '三文鱼', emoji: '🐟', category: '蛋白质', kcalPer100g: 208 },
  { id: 'broccoli', name: '西兰花', emoji: '🥦', category: '蔬菜', kcalPer100g: 34 },
  { id: 'tomato', name: '番茄', emoji: '🍅', category: '蔬菜', kcalPer100g: 18 },
  { id: 'mushroom', name: '菌菇', emoji: '🍄', category: '蔬菜', kcalPer100g: 26 },
  { id: 'spinach', name: '菠菜', emoji: '🥬', category: '蔬菜', kcalPer100g: 23 },
  { id: 'quinoa', name: '藜麦', emoji: '🌾', category: '主食', kcalPer100g: 120 },
  { id: 'brownRice', name: '糙米饭', emoji: '🍚', category: '主食', kcalPer100g: 116 },
];
