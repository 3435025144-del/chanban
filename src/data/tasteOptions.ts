export const FLAVOR_OPTIONS = [
  '清淡', '咸鲜', '香辣', '麻辣', '酸辣', '甜口', '酸甜', '酱香', '烧烤味', '异国风味',
] as const;

export const TABOO_TABS = ['饮食禁忌', '常见忌口'] as const;
export type TabooTab = (typeof TABOO_TABS)[number];

export const DIETARY_TABOOS = ['过敏', '宗教', '医嘱'] as const;

export const DIETARY_TABOO_PLACEHOLDERS: Record<string, string> = {
  过敏: '例如：花生、海鲜、牛奶过敏',
  宗教: '例如：清真、素食等饮食要求',
  医嘱: '例如：医生建议少盐、低糖',
};

export interface CommonTabooGroup {
  name: string;
  items: string[];
}

export const COMMON_TABOO_GROUPS: CommonTabooGroup[] = [
  { name: '辛辣刺激', items: ['辣椒', '花椒', '芥末', '生蒜'] },
  { name: '油腻煎炸', items: ['炸鸡', '烧烤', '肥肉', '奶油'] },
  { name: '生冷食物', items: ['冰饮', '刺身', '凉拌菜'] },
  { name: '甜类', items: ['糖', '蛋糕', '奶茶', '含糖饮料'] },
  { name: '咸类', items: ['腌制品', '酱菜', '咸鱼', '加工肉'] },
  { name: '发物类', items: ['海鲜', '羊肉', '鹅肉', '菌菇'] },
  { name: '特殊食材', items: ['香菜', '葱', '姜', '蒜', '内脏', '动物血', '豆制品'] },
];

export const ALL_TABOO_ITEMS = COMMON_TABOO_GROUPS.flatMap((group) => group.items);

export interface GoalOption {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: 'steady', title: '想稳住体重', subtitle: '按现在体重不涨不跌，不用刻意减', buttonText: '看看适合我的吃法' },
  { id: 'regular', title: '想让三餐规律些', subtitle: '先把饭点固定下来，吃什么不硬要求', buttonText: '看看规律三餐怎么排' },
  { id: 'easy', title: '想轻松点，别有压力', subtitle: '不设硬指标，只给做得到的建议', buttonText: '看看轻松版建议' },
];

export function goalTitle(id: string): string {
  return GOAL_OPTIONS.find((option) => option.id === id)?.title ?? id;
}

export interface GoalPlan {
  intro: string;
  points: string[];
  closing: string;
}

export const GOAL_PLANS: Record<string, GoalPlan> = {
  steady: {
    intro: '不用刻意节食，先把每餐吃踏实，体重自然会慢慢稳下来。',
    points: [
      '三餐尽量固定饭点，别让身体一会儿饿一会儿撑。',
      '每餐吃到七分饱就够了，Slow down，给自己一点感受饱腹的时间。',
      '主食照吃，多一些粗粮和蔬菜，少一些油炸和甜饮。',
      '体重小幅波动很正常，看一段时间的平均，别被某一天的数字牵着走。',
    ],
    closing: '好好吃饭，就是稳住体重最温柔的方式。',
  },
  regular: {
    intro: '先把吃饭的时间固定下来，吃什么不硬要求，规律本身就是照顾自己。',
    points: [
      '起床后 1 小时内吃早餐，哪怕只是一个鸡蛋、一杯牛奶。',
      '午餐尽量在 11:30–13:00，给身体稳定的能量。',
      '下午饿了可以加餐，水果、酸奶、坚果都算数，不算放纵。',
      '晚餐别太晚，睡前 2–3 小时吃完，肠胃也能好好休息。',
    ],
    closing: '从固定一顿饭开始就好，慢慢来，不用一次做到完美。',
  },
  easy: {
    intro: '没有硬指标，也没有必须完成的任务，这里只给你做得到的建议。',
    points: [
      '今天想吃就吃，不想记就不记，记录不是考试。',
      '忙起来随便吃点也没关系，方便面加个蛋也是认真的一餐。',
      '累了就歇一歇，散步十分钟、喝够水，都算好好照顾自己。',
      '放纵餐可以被喜欢，下一餐照常开始，不需要任何补偿。',
    ],
    closing: '你已经在照顾自己了，这件事本身就值得开心。',
  },
};

export function goalPlan(id: string): GoalPlan | undefined {
  return GOAL_PLANS[id];
}

const FLAVOR_KEYWORDS: Record<string, string[]> = {
  清淡: ['清淡', '清爽', '清汤', '蒸', '嫩', '少油', '暖', '沙拉', '轻'],
  咸鲜: ['咸鲜', '酱', '卤', '焖', '牛腩', '黑椒', '茶泡'],
  香辣: ['香辣', '黑椒', '烤翅', '奥尔良', '微辣'],
  麻辣: ['麻辣', '辣', '火锅', '花椒'],
  酸辣: ['酸辣', '酸', '醋', '柠檬'],
  甜口: ['甜', '糖', '酸奶', '水果', '甜品'],
  酸甜: ['酸甜', '柠檬', '番茄', '莓', '水果'],
  酱香: ['酱', '照烧', '黑椒', '卤', '牛肉'],
  烧烤味: ['烧烤', '烤', '奥尔良', '炭'],
  异国风味: ['日式', '藜麦', '牛油果', '能量碗', '沙拉', '咖啡', '拿铁'],
};

const TABOO_KEYWORDS: Record<string, string[]> = {
  辣椒: ['辣', '麻辣', '香辣', '奥尔良', '黑椒', '火锅'],
  花椒: ['花椒', '麻辣', '火锅'],
  芥末: ['芥末', '刺身'],
  生蒜: ['蒜泥', '生蒜', '蘸料'],
  炸鸡: ['炸', '烤翅', '薯条'],
  烧烤: ['烧烤', '烤翅', '奥尔良'],
  肥肉: ['肥', '红烧', '牛腩'],
  奶油: ['奶油', '芝士', '奶盖'],
  冰饮: ['冰', '冰美式', '冰饮'],
  刺身: ['刺身', '三文鱼'],
  凉拌菜: ['凉拌', '沙拉'],
  糖: ['糖', '甜', '奶茶', '多肉葡萄', '蛋糕'],
  蛋糕: ['蛋糕', '蛋白棒'],
  奶茶: ['奶茶', '葡萄', '喜茶', '奶盖'],
  含糖饮料: ['含糖', '糖', '奶茶', '葡萄'],
  腌制品: ['腌', '酱菜', '咸鱼'],
  酱菜: ['酱菜', '腌', '泡菜'],
  咸鱼: ['咸鱼', '腌'],
  加工肉: ['加工肉', '火腿', '培根'],
  海鲜: ['海鲜', '虾', '三文鱼', '虾滑'],
  羊肉: ['羊肉'],
  鹅肉: ['鹅肉'],
  菌菇: ['菌菇', '蘑菇', '香菇'],
  香菜: ['香菜'],
  葱: ['葱'],
  姜: ['姜'],
  蒜: ['蒜', '蒜泥'],
  内脏: ['内脏', '毛肚', '动物血'],
  动物血: ['动物血', '鸭血'],
  豆制品: ['豆腐', '豆干', '豆制品'],
};

const GOAL_KEYWORDS: Record<string, string[]> = {
  steady: ['清淡', '蒸', '沙拉', '糙米', '藜麦', '少油', '无糖'],
  regular: ['饭', '面', '早餐', '蛋', '粥', '糙米'],
  easy: ['汤', '暖', '舒服', '轻松', '酸奶', '水果', '沙拉'],
};

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export interface TasteMatch {
  score: number;
  matchedFlavors: string[];
  matchedGoal: boolean;
  blockedByTaboo: boolean;
}

export function matchFoodTaste(
  food: { name: string; desc: string; tag: string; category: string },
  taste: { flavors: string[]; avoid: string[]; goal: string },
): TasteMatch {
  const text = `${food.name}${food.desc}${food.tag}${food.category}`;
  const matchedFlavors = taste.flavors.filter((flavor) => includesAny(text, FLAVOR_KEYWORDS[flavor] ?? []));
  const blockedByTaboo = taste.avoid.some((item) => includesAny(text, TABOO_KEYWORDS[item] ?? []));
  const matchedGoal = includesAny(text, GOAL_KEYWORDS[taste.goal] ?? []);
  const score = matchedFlavors.length * 2 + (matchedGoal ? 2 : 0) - (blockedByTaboo ? 6 : 0);
  return { score, matchedFlavors, matchedGoal, blockedByTaboo };
}

export function preferenceTags(taste: { flavors: string[]; dietaryTaboos: string[]; avoid: string[]; goal: string }): string[] {
  const tags: string[] = [];
  taste.flavors.forEach((flavor) => tags.push(flavor));
  const goalName = GOAL_OPTIONS.find((option) => option.id === taste.goal)?.title;
  if (goalName) tags.push(goalName);
  taste.dietaryTaboos.forEach((item) => tags.push(item));
  taste.avoid.slice(0, 3).forEach((item) => tags.push(`忌${item}`));
  return tags;
}
