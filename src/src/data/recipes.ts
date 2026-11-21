export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  calories: number;
  tip: string;
  steps: string[];
  tag: string;
}

export const recipes: Recipe[] = [
  { id: 'r01', name: '香煎鸡胸藜麦碗', emoji: '🥗', ingredients: ['chicken', 'quinoa', 'broccoli'], calories: 420, tip: '不粘锅刷薄薄一层油就够，鸡胸煎好静置 3 分钟更嫩。', steps: ['藜麦煮熟备用，西兰花焯水 2 分钟。', '鸡胸切片，用黑胡椒和少许盐腌 10 分钟。', '煎熟鸡胸，所有食材装碗拌匀。'], tag: '高蛋白' },
  { id: 'r02', name: '少油番茄炒蛋', emoji: '🍳', ingredients: ['egg', 'tomato'], calories: 260, tip: '先炒番茄出汁再放蛋，能少放一半油也很香。', steps: ['番茄切块，鸡蛋打散加少许水。', '番茄炒软出汁后倒入蛋液。', '小火滑熟，撒葱花出锅。'], tag: '家常' },
  { id: 'r03', name: '虾仁西兰花', emoji: '🍤', ingredients: ['shrimp', 'broccoli'], calories: 210, tip: '虾仁焯水 30 秒就捞起，口感弹、不用久炒。', steps: ['西兰花掰小朵焯水。', '虾仁去虾线焯至变色。', '两者快炒，加蒜末调味。'], tag: '清爽' },
  { id: 'r04', name: '豆腐菌菇汤', emoji: '🍲', ingredients: ['tofu', 'mushroom', 'spinach'], calories: 180, tip: '菌菇先干煸出香再加水，汤头鲜到不用味精。', steps: ['菌菇切片干煸至微焦。', '加水煮开，放嫩豆腐块。', '出锅前放菠菜，少许盐调味。'], tag: '暖胃' },
  { id: 'r05', name: '黑椒牛肉糙米饭', emoji: '🍛', ingredients: ['beef', 'brownRice', 'broccoli'], calories: 510, tip: '牛肉逆纹切薄片，嫩滑不柴，酱汁只放半勺。', steps: ['糙米饭提前煮好。', '牛肉用黑胡椒、生抽抓匀。', '快炒牛肉，配糙米饭和焯西兰花。'], tag: '饱腹' },
  { id: 'r06', name: '柠檬煎三文鱼', emoji: '🍋', ingredients: ['salmon', 'spinach'], calories: 390, tip: '鱼皮朝下先煎 4 分钟，翻面 2 分钟，外脆里嫩。', steps: ['三文鱼撒盐和黑胡椒。', '鱼皮朝下煎至金黄再翻面。', '挤柠檬汁，配快炒菠菜。'], tag: '优质脂肪' },
  { id: 'r07', name: '鸡胸蔬菜卷', emoji: '🌯', ingredients: ['chicken', 'spinach', 'tomato'], calories: 330, tip: '用生菜叶代替饼皮，脆爽又轻盈。', steps: ['鸡胸煎熟切条。', '生菜洗净沥干，番茄切丝。', '所有材料卷起，蘸一点酸奶酱。'], tag: '低卡' },
  { id: 'r08', name: '番茄牛肉汤', emoji: '🥣', ingredients: ['beef', 'tomato', 'tofu'], calories: 340, tip: '番茄多煮一会儿自然变浓，不用勾芡。', steps: ['牛肉焯水去浮沫。', '番茄炒出沙后加水和牛肉炖 20 分钟。', '放豆腐块再煮 5 分钟。'], tag: '炖煮' },
  { id: 'r09', name: '虾仁蒸蛋', emoji: '🥚', ingredients: ['egg', 'shrimp'], calories: 220, tip: '蛋液加 1.5 倍温水并过筛，蒸出来像布丁。', steps: ['鸡蛋打散加温水搅匀。', '盖保鲜膜中小火蒸 10 分钟。', '铺虾仁再蒸 3 分钟，淋少许生抽。'], tag: '嫩滑' },
  { id: 'r10', name: '蒜香菠菜炒蘑菇', emoji: '🥬', ingredients: ['spinach', 'mushroom'], calories: 150, tip: '菠菜最后 30 秒下锅，颜色翠绿营养也不流失。', steps: ['蘑菇切片炒至出水收干。', '加大蒜末爆香。', '放菠菜快炒断生即可。'], tag: '快手' },
  { id: 'r11', name: '藜麦鸡蛋沙拉', emoji: '🥙', ingredients: ['egg', 'quinoa', 'tomato'], calories: 380, tip: '用无糖酸奶代替沙拉酱，口感同样绵密。', steps: ['藜麦煮熟放凉。', '鸡蛋煮熟切块，番茄切丁。', '拌入两勺无糖酸奶和黑胡椒。'], tag: '轻食' },
  { id: 'r12', name: '鸡胸菌菇炖饭', emoji: '🍚', ingredients: ['chicken', 'mushroom', 'brownRice'], calories: 470, tip: '菌菇的鲜味足够，盐放在最后加更不容易过量。', steps: ['菌菇切片炒香，加鸡胸丁翻炒。', '倒入糙米饭和一碗水。', '小火炖 12 分钟，收汁调味。'], tag: '一锅端' },
  { id: 'r13', name: '香烤三文鱼配藜麦', emoji: '🐟', ingredients: ['salmon', 'quinoa', 'broccoli'], calories: 520, tip: '烤箱 200℃ 12 分钟，不用额外加油。', steps: ['三文鱼抹黑胡椒和盐。', '200℃ 烤 12 分钟。', '配藜麦和焯西兰花装盘。'], tag: '烤箱' },
  { id: 'r14', name: '虾仁豆腐煲', emoji: '🦐', ingredients: ['shrimp', 'tofu', 'tomato'], calories: 290, tip: '嫩豆腐下锅后别大力翻动，用锅铲背轻推。', steps: ['番茄炒出汁加水煮开。', '放豆腐块小火煮 5 分钟。', '加虾仁煮至变色，撒葱花。'], tag: '下饭' },
  { id: 'r15', name: '番茄鸡蛋糙米盖饭', emoji: '🍅', ingredients: ['egg', 'tomato', 'brownRice'], calories: 460, tip: '番茄先去皮，孩子和胃不好的人都更好消化。', steps: ['番茄划十字烫过去皮切块。', '炒蛋盛出，番茄炒成酱。', '合炒后盖在糙米饭上。'], tag: '家常' },
  { id: 'r16', name: '菠菜鸡胸蛋花汤', emoji: '🥣', ingredients: ['chicken', 'spinach', 'egg'], calories: 250, tip: '蛋液沿筷子细流倒入，蛋花漂亮又均匀。', steps: ['鸡胸切丝加水煮开。', '淋蛋液成蛋花。', '放菠菜，调味出锅。'], tag: '清爽' },
  { id: 'r17', name: '嫩豆腐蒸虾', emoji: '🦀', ingredients: ['tofu', 'shrimp'], calories: 190, tip: '蒸鱼豉油只淋一点点，鲜味主要来自虾本身。', steps: ['豆腐切厚片摆盘。', '虾仁开背铺在豆腐上。', '蒸 8 分钟，淋少许豉油和香油。'], tag: '低脂' },
  { id: 'r18', name: '黑椒菌菇牛肉粒', emoji: '🍄', ingredients: ['beef', 'mushroom'], calories: 310, tip: '牛肉粒先煎锁汁，再和菌菇合炒，不会出水变老。', steps: ['牛肉切粒用黑胡椒腌 10 分钟。', '大火煎至表面焦香盛出。', '炒香菌菇后倒回牛肉翻匀。'], tag: '快手' },
  { id: 'r19', name: '藜麦时蔬沙拉', emoji: '🥗', ingredients: ['quinoa', 'broccoli', 'tomato', 'mushroom'], calories: 350, tip: '蔬菜焯水后过凉水，口感更脆，也少吸油。', steps: ['藜麦煮熟放凉。', '西兰花和菌菇焯水。', '所有材料加柠檬汁和橄榄油少许拌匀。'], tag: '素食' },
  { id: 'r20', name: '香烤鸡胸配糙米', emoji: '🍗', ingredients: ['chicken', 'brownRice'], calories: 440, tip: '鸡胸表面刷一层酸奶再烤，鲜嫩不干柴。', steps: ['鸡胸涂酸奶、黑胡椒、盐。', '200℃ 烤 18 分钟。', '切片配糙米饭食用。'], tag: '备餐' },
  { id: 'r21', name: '三文鱼菠菜藜麦卷', emoji: '🌿', ingredients: ['salmon', 'spinach', 'quinoa'], calories: 480, tip: '三文鱼煎好后压碎拌藜麦，卷起来一口一个。', steps: ['三文鱼煎熟压碎。', '菠菜焯水后摊平。', '铺藜麦和三文鱼卷起切段。'], tag: '有趣' },
  { id: 'r22', name: '番茄豆腐蛋花汤', emoji: '🍲', ingredients: ['tomato', 'tofu', 'egg'], calories: 200, tip: '先煮番茄再放豆腐，汤更浓，豆腐也不易碎。', steps: ['番茄切块炒软加水。', '水开后放豆腐丁。', '淋蛋液，调味出锅。'], tag: '轻负担' },
];

export function matchRecipes(selected: string[]): Recipe[] {
  if (selected.length === 0) return [];
  const scored = recipes
    .map((recipe) => ({
      recipe,
      score: recipe.ingredients.filter((id) => selected.includes(id)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.recipe.calories - b.recipe.calories);
  return scored.slice(0, 3).map((item) => item.recipe);
}
