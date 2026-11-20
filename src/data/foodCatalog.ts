import { recommendations } from './recommendations';
import { recipes, type Recipe } from './recipes';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  category: string;
  emoji: string;
  desc: string;
  tag: string;
  price: number;
  minutes: number;
}

export interface MerchantOffer {
  id: string;
  merchantId: string;
  merchantName: string;
  foodId: string;
  foodName: string;
  dish: string;
  category: string;
  calories: number;
  price: number;
  distance: string;
  deliveryMinutes: number;
  etaMinutes: number;
  isOpen: boolean;
  address: string;
  recommend: string;
  avoid: string;
  channel: 'delivery' | 'nearby';
}

const categoryByRecommendation: Record<string, string> = {
  'r-beef': '简餐',
  'r-avocado': '简餐',
  'r-egg': '简餐',
  'r-noodle': '快餐',
  'r-salmon': '简餐',
  'r-soup': '简餐',
  'r-yogurt': '简餐',
  'r-chicken': '简餐',
};

export const foods: FoodItem[] = [
  ...recommendations.map((r) => ({
    id: `food-${r.id}`,
    name: r.name,
    calories: r.calories,
    category: categoryByRecommendation[r.id] ?? '简餐',
    emoji: r.emoji,
    desc: r.desc,
    tag: r.tag,
    price: r.price,
    minutes: r.minutes,
  })),
  { id: 'food-r05', name: '黑椒牛肉糙米饭', calories: 510, category: '简餐', emoji: '🍛', desc: '牛肉逆纹切薄片，配一碗扎实糙米饭。', tag: '饱腹', price: 29, minutes: 20 },
  { id: 'food-latte', name: '生椰拿铁（无糖燕麦奶）', calories: 210, category: '早餐', emoji: '☕', desc: '无糖换燕麦奶，配一颗水煮蛋更像早餐。', tag: '瑞幸咖啡', price: 18, minutes: 18 },
  { id: 'food-americano', name: '冰美式 + 蛋白棒', calories: 180, category: '咖啡', emoji: '🥤', desc: '自带杯更环保，蛋白棒替掉三角蛋糕。', tag: '星巴克', price: 32, minutes: 15 },
  { id: 'food-burger', name: '板烧鸡腿堡套餐（去酱）', calories: 480, category: '快餐', emoji: '🍔', desc: '去酱配玉米杯，薯条换小份更稳。', tag: '麦当劳', price: 36, minutes: 25 },
  { id: 'food-wings', name: '新奥尔良烤翅 + 蔬菜沙拉', calories: 430, category: '快餐', emoji: '🍗', desc: '烤翅两对，酱料只用一半。', tag: '肯德基', price: 39, minutes: 26 },
  { id: 'food-hotpot', name: '清汤锅涮牛肉蔬菜', calories: 620, category: '火锅', emoji: '🍲', desc: '番茄锅配虾滑和蔬菜，蘸料用醋+蒜泥。', tag: '海底捞', price: 88, minutes: 55 },
  { id: 'food-convenience', name: '茶叶蛋鸡胸沙拉', calories: 350, category: '简餐', emoji: '🏪', desc: '热柜关东煮选萝卜海带，酱料少挤。', tag: '便利店', price: 22, minutes: 10 },
  { id: 'food-grape', name: '多肉葡萄（少少糖）', calories: 160, category: '简餐', emoji: '🧋', desc: '少少糖、去芝士、少冰，清爽解馋。', tag: '喜茶', price: 19, minutes: 20 },
];

export function foodById(id: string | null | undefined): FoodItem | null {
  return foods.find((f) => f.id === id) ?? null;
}

export function recipeFood(recipe: Recipe): FoodItem {
  return {
    id: `food-${recipe.id}`,
    name: recipe.name,
    calories: recipe.calories,
    category: '简餐',
    emoji: recipe.emoji,
    desc: recipe.tip,
    tag: recipe.tag,
    price: Math.max(12, Math.round(recipe.calories / 22)),
    minutes: recipe.steps.length * 5 + 5,
  };
}

const offer = (
  id: string,
  merchantName: string,
  foodId: string,
  foodName: string,
  category: string,
  price: number,
  distance: string,
  deliveryMinutes: number,
  etaMinutes: number,
  channel: 'delivery' | 'nearby',
  isOpen: boolean,
  address: string,
  recommend: string,
  avoid: string,
): MerchantOffer => ({
  id, merchantId: `${channel}-${id}`, merchantName, foodId, foodName,
  dish: foodName, category,
  calories: foodById(foodId)?.calories ?? 0,
  price, distance, deliveryMinutes, etaMinutes, isOpen, address, recommend, avoid, channel,
});

export const merchantOffers: MerchantOffer[] = [
  offer('d1', '米粒研究室', 'food-r-beef', '番茄牛腩饭', '简餐', 28, '1.2km', 32, 16, 'delivery', true, '光谷一路 18 号', '番茄牛腩饭配半份米饭，多加一份青菜', '少加浇汁，酱料单独放'),
  offer('d2', '青禾轻食工坊', 'food-r-avocado', '鸡肉牛油果能量碗', '简餐', 32, '900m', 28, 10, 'delivery', true, '高新大道 66 号', '能量碗少放沙拉酱，多加西兰花', '避开油炸豆腐和糖渍小番茄'),
  offer('d3', '一碗暖汤', 'food-r-egg', '虾仁蒸蛋 + 糙米饭', '简餐', 24, '1.1km', 30, 14, 'delivery', true, '珞喻路 203 号', '蒸蛋配半份糙米饭，暖胃好消化', '汤里少放辣油，别勾芡'),
  offer('d4', '海边小面', 'food-r-noodle', '清汤牛肉荞麦面', '快餐', 26, '800m', 25, 12, 'delivery', true, '关山大道 12 号', '清汤荞麦面青菜多要一份', '少喝汤底，钠含量偏高'),
  offer('d5', '青禾轻食工坊', 'food-r-salmon', '柠檬三文鱼沙拉', '简餐', 38, '900m', 30, 10, 'delivery', true, '高新大道 66 号', '柠檬汁替掉一半沙拉酱', '别选油炸三文鱼'),
  offer('d6', '一碗暖汤', 'food-r-soup', '番茄豆腐菌菇汤', '简餐', 18, '1.1km', 28, 14, 'delivery', true, '珞喻路 203 号', '菌菇豆腐汤配半份糙米', '汤里少放辣油，别勾芡'),
  offer('d7', '果咔鲜果', 'food-r-yogurt', '无糖酸奶水果杯', '简餐', 16, '240m', 20, 5, 'delivery', true, '光谷广场 B1', '无糖酸奶加一份莓果', '别选糖浆和炼乳口味'),
  offer('d8', '青禾轻食工坊', 'food-r-chicken', '黑椒鸡胸藜麦碗', '简餐', 30, '900m', 28, 10, 'delivery', true, '高新大道 66 号', '藜麦碗少酱多加西兰花', '避开油炸豆腐'),
  offer('d9', '米粒研究室', 'food-r05', '黑椒牛肉糙米饭', '简餐', 29, '1.2km', 32, 16, 'delivery', true, '光谷一路 18 号', '牛肉糙米饭配半份青菜，酱汁半勺', '少加浇汁，米饭吃半份'),
  offer('d10', '瑞幸咖啡', 'food-latte', '生椰拿铁（无糖燕麦奶）', '早餐', 18, '450m', 18, 6, 'delivery', true, '光谷广场 1 层', '无糖 + 换燕麦奶，配一颗水煮蛋', '别加奶油顶和风味糖浆'),
  offer('d11', '星巴克', 'food-americano', '冰美式 + 蛋白棒', '咖啡', 32, '700m', 15, 9, 'delivery', true, '高新大道 88 号', '自带杯，蛋白棒替掉蛋糕', '星冰乐糖分很高，偶尔喝就好'),
  offer('d12', '麦当劳', 'food-burger', '板烧鸡腿堡套餐（去酱）', '快餐', 36, '1.3km', 25, 18, 'delivery', true, '关山大道 5 号', '板烧鸡腿堡去酱，配玉米杯和无糖可乐', '薯条换玉米杯，酱料单独放'),
  offer('d13', '肯德基', 'food-wings', '新奥尔良烤翅 + 蔬菜沙拉', '快餐', 39, '1.5km', 26, 20, 'delivery', true, '光谷一路 9 号', '烤翅 2 对 + 蔬菜沙拉，酱料只用一半', '炸鸡和蛋挞容易超量'),
  offer('d14', '海底捞', 'food-hotpot', '清汤锅涮牛肉蔬菜', '火锅', 88, '2.1km', 55, 25, 'delivery', true, '高新大道 120 号', '清汤锅多涮虾滑、牛肉和蔬菜，醋+蒜泥蘸料', '麻酱和油碟热量密度高，浅浅一勺就够'),
  offer('d15', '便利店（711/罗森）', 'food-convenience', '茶叶蛋鸡胸沙拉', '简餐', 22, '180m', 10, 4, 'delivery', true, '光谷广场 B1', '茶叶蛋 + 鸡胸肉 + 一份沙拉', '饭团和三明治沙拉酱少挤'),
  offer('d16', '喜茶', 'food-grape', '多肉葡萄（少少糖）', '简餐', 19, '520m', 20, 8, 'delivery', true, '高新大道 30 号', '少少糖 + 去芝士 + 少冰', '芝士奶盖和小料是糖分大户'),

  offer('n1', '青禾轻食工坊', 'food-r-avocado', '鸡肉牛油果能量碗', '简餐', 32, '320m', 0, 8, 'nearby', true, '高新大道 66 号', '能量碗少放沙拉酱，多加西兰花', '避开油炸豆腐和糖渍小番茄'),
  offer('n2', '一碗暖汤', 'food-r-soup', '番茄豆腐菌菇汤', '简餐', 18, '560m', 0, 10, 'nearby', true, '珞喻路 203 号', '菌菇豆腐汤配半份糙米，暖胃又清爽', '汤里少放辣油，别勾芡'),
  offer('n3', '海边小面', 'food-r-noodle', '清汤牛肉荞麦面', '快餐', 26, '800m', 0, 12, 'nearby', true, '关山大道 12 号', '清汤荞麦面加卤蛋，青菜多要一份', '少喝汤底，钠含量偏高'),
  offer('n4', '米粒研究室', 'food-r05', '黑椒牛肉糙米饭', '简餐', 29, '1.1km', 0, 15, 'nearby', true, '光谷一路 18 号', '牛肉糙米饭配半份青菜，酱汁半勺', '少加浇汁，米饭吃半份'),
  offer('n5', '果咔鲜果', 'food-r-yogurt', '无糖酸奶水果杯', '简餐', 16, '240m', 0, 5, 'nearby', true, '光谷广场 B1', '无糖酸奶水果杯加一份莓果', '别选糖浆和炼乳口味'),
  offer('n6', '青禾轻食工坊', 'food-r-chicken', '黑椒鸡胸藜麦碗', '简餐', 30, '320m', 0, 8, 'nearby', true, '高新大道 66 号', '藜麦碗少酱多加西兰花', '避开油炸豆腐'),
  offer('n7', '米粒研究室', 'food-r-beef', '番茄牛腩饭', '简餐', 28, '1.1km', 0, 15, 'nearby', true, '光谷一路 18 号', '番茄牛腩饭配半份米饭，多加青菜', '少加浇汁，酱料单独放'),
  offer('n8', '一碗暖汤', 'food-r-egg', '虾仁蒸蛋 + 糙米饭', '简餐', 24, '560m', 0, 10, 'nearby', true, '珞喻路 203 号', '蒸蛋配半份糙米饭，暖胃好消化', '汤里少放辣油'),
  offer('n9', '青禾轻食工坊', 'food-r-salmon', '柠檬三文鱼沙拉', '简餐', 38, '320m', 0, 8, 'nearby', false, '高新大道 66 号', '柠檬汁替掉一半沙拉酱', '晚间暂停供应'),
];

export function offersFor(foodId: string | null | undefined, channel: MerchantOffer['channel']): MerchantOffer[] {
  if (!foodId) return [];
  return merchantOffers.filter((o) => o.foodId === foodId && o.channel === channel);
}

const recipeByFoodId: Record<string, string> = {
  'food-r05': 'r05',
  'food-r-egg': 'r09',
  'food-r-soup': 'r22',
};

export function recipeForFood(foodId: string | null | undefined): Recipe | null {
  if (!foodId) return null;
  const recipeId = recipeByFoodId[foodId];
  return recipes.find((r) => r.id === recipeId) ?? null;
}

export function similarFoods(foodId: string | null | undefined): FoodItem[] {
  const food = foodById(foodId);
  if (!food) return foods.slice(0, 4);
  const keyword = food.name.slice(0, 2);
  return foods.filter((f) => f.id !== food.id && (f.name.includes(keyword) || f.category === food.category)).slice(0, 4);
}
