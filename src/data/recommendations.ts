export interface Recommendation {
  id: string;
  name: string;
  desc: string;
  tag: string;
  calories: number;
  price: number;
  minutes: number;
  emoji: string;
  bg: string;
}

export const recommendations: Recommendation[] = [
  { id: 'r-beef', name: '番茄牛腩饭', desc: '暖乎乎、不太油，今晚刚刚好。', tag: '符合你的清淡偏好', calories: 620, price: 28, minutes: 25, emoji: '🍛', bg: 'from-[#FFF3E4] to-[#FFE3CC]' },
  { id: 'r-avocado', name: '鸡肉牛油果能量碗', desc: '清爽饱腹，颜色也让人开心。', tag: '常点 3 次', calories: 460, price: 32, minutes: 20, emoji: '🥗', bg: 'from-[#EDF7E8] to-[#DFF0D9]' },
  { id: 'r-egg', name: '虾仁蒸蛋 + 糙米饭', desc: '嫩嫩的蛋羹，胃也会觉得舒服。', tag: '暖胃好消化', calories: 420, price: 24, minutes: 18, emoji: '🍮', bg: 'from-[#FFF6E3] to-[#FFEBC8]' },
  { id: 'r-noodle', name: '清汤牛肉荞麦面', desc: '汤清味足，慢慢吃很满足。', tag: '想吃热的时候', calories: 510, price: 26, minutes: 15, emoji: '🍜', bg: 'from-[#FFF0E8] to-[#FFDCCB]' },
  { id: 'r-salmon', name: '柠檬三文鱼沙拉', desc: '一点点酸，配优质脂肪刚好。', tag: '轻盈但不委屈', calories: 480, price: 38, minutes: 22, emoji: '🥙', bg: 'from-[#EAF5FF] to-[#D8EAF7]' },
  { id: 'r-soup', name: '番茄豆腐菌菇汤', desc: '热汤下肚，今天也算被照顾到了。', tag: '不想太撑', calories: 320, price: 18, minutes: 16, emoji: '🍲', bg: 'from-[#FFF1EC] to-[#FFE0D5]' },
  { id: 'r-yogurt', name: '无糖酸奶水果杯', desc: '甜甜的快乐，也可以很清爽。', tag: '想吃点甜的', calories: 280, price: 16, minutes: 5, emoji: '🍓', bg: 'from-[#FFF0F3] to-[#FFDDE5]' },
  { id: 'r-chicken', name: '黑椒鸡胸藜麦碗', desc: '扎实又舒服，下午不容易饿。', tag: '饱腹不油腻', calories: 520, price: 30, minutes: 24, emoji: '🍗', bg: 'from-[#F0F5E8] to-[#E2EDD2]' },
];

export function recommendationForMeal(meal: string): Recommendation {
  const index = meal === 'breakfast' ? 2 : meal === 'lunch' ? 1 : meal === 'snack' ? 6 : meal === 'late' ? 5 : 0;
  return recommendations[index];
}
