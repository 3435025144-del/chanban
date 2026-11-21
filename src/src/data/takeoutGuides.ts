export interface NearbyMerchant {
  id: string;
  name: string;
  type: string;
  dish: string;
  avgCalories: number;
  emoji: string;
  distance: string;
  category: string;
  frequency: number;
  recommend: string;
  avoid: string;
}

export const nearbyMerchants: NearbyMerchant[] = [
  { id: 'n1', name: '青禾轻食工坊', type: '轻食沙拉', dish: '鸡胸藜麦能量碗', avgCalories: 420, emoji: '🥗', distance: '320m', category: '轻食', frequency: 12, recommend: '鸡胸藜麦碗少放沙拉酱，多加一份西兰花', avoid: '避开油炸豆腐和糖渍小番茄' },
  { id: 'n2', name: '一碗暖汤', type: '中式汤品', dish: '菌菇豆腐汤 + 半份糙米', avgCalories: 310, emoji: '🍲', distance: '560m', category: '汤品', frequency: 8, recommend: '菌菇豆腐汤配半份糙米，暖胃又清爽', avoid: '汤里少放辣油，别勾芡' },
  { id: 'n3', name: '海边小面', type: '面食', dish: '清汤荞麦面加卤蛋', avgCalories: 450, emoji: '🍜', distance: '800m', category: '面食', frequency: 15, recommend: '清汤荞麦面加卤蛋，青菜多要一份', avoid: '少喝汤底，钠含量偏高' },
  { id: 'n4', name: '米粒研究室', type: '日式简餐', dish: '三文鱼茶泡饭', avgCalories: 480, emoji: '🍣', distance: '1.1km', category: '日式', frequency: 5, recommend: '三文鱼茶泡饭饭量减半，配一份温泉蛋', avoid: '少加照烧酱和腌小菜' },
  { id: 'n5', name: '果咔鲜果', type: '果饮甜品', dish: '无糖酸奶水果杯', avgCalories: 190, emoji: '🍓', distance: '240m', category: '甜品', frequency: 21, recommend: '无糖酸奶水果杯加一份莓果，清爽解馋', avoid: '别选糖浆和炼乳口味' },
];

export interface TakeoutGuide {
  id: string;
  brand: string;
  emoji: string;
  orderTip: string;
  calories: number;
  avoid: string;
  category: string;
  frequency: number;
}

export const takeoutGuides: TakeoutGuide[] = [
  { id: 't1', brand: '瑞幸咖啡', emoji: '☕', orderTip: '生椰拿铁选「无糖 + 换燕麦奶」，配一颗水煮蛋当早餐。', calories: 210, avoid: '别加奶油顶和风味糖浆。', category: '早餐', frequency: 18 },
  { id: 't2', brand: '麦当劳', emoji: '🍔', orderTip: '板烧鸡腿堡去酱，配玉米杯和无糖可乐。', calories: 480, avoid: '薯条换成玉米杯，酱料单独放。', category: '快餐', frequency: 9 },
  { id: 't3', brand: '肯德基', emoji: '🍗', orderTip: '新奥尔良烤翅 2 对 + 蔬菜沙拉，酱料只用一半。', calories: 430, avoid: '炸鸡和蛋挞容易不知不觉超量。', category: '快餐', frequency: 7 },
  { id: 't4', brand: '星巴克', emoji: '🥤', orderTip: '冰美式 + 三角蛋糕换「蛋白棒」，自带杯更环保。', calories: 180, avoid: '星冰乐系列糖分很高，偶尔喝就好。', category: '咖啡', frequency: 11 },
  { id: 't5', brand: '海底捞', emoji: '🍲', orderTip: '清汤锅 + 番茄锅，多涮虾滑、牛肉和蔬菜，蘸料用醋+蒜泥。', calories: 620, avoid: '麻酱和油碟热量密度很高，浅浅一勺就够。', category: '火锅', frequency: 4 },
  { id: 't6', brand: '沙县小吃', emoji: '🥟', orderTip: '鸡腿饭去皮，米饭吃半份，加一份青菜。', calories: 540, avoid: '花生酱拌面和炸物拼盘慎点。', category: '简餐', frequency: 13 },
  { id: 't7', brand: '喜茶', emoji: '🧋', orderTip: '多肉葡萄选「少少糖 + 去芝士 + 少冰」。', calories: 160, avoid: '芝士奶盖和小料是糖分大户。', category: '茶饮', frequency: 16 },
  { id: 't8', brand: '便利店（711/罗森）', emoji: '🏪', orderTip: '茶叶蛋 + 鸡胸肉 + 一份沙拉，热柜关东煮选萝卜海带。', calories: 350, avoid: '饭团和三明治的沙拉酱可以少挤一点。', category: '便利店', frequency: 22 },
];
