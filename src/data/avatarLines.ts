import type { Personality } from '../types';

export const gentleLines: string[] = [
  '你今天有好好吃饭吗？有的话就太好了，我陪着你呢。',
  '慢慢来，好吃的东西和好心情都值得被认真对待。',
  '我记得你上次记录的样子，那时候你笑得特别好看。',
  '嘴馋不是坏事情呀，它在提醒你生活还挺有味道的。',
  '今天想吃什么就告诉我，我们一起把它记下来。',
  '你已经很努力了，现在可以先把肩膀放松一下。',
  '一份食物只是一份食物，你可比它有趣多啦。',
  '就算今天吃得热闹一点，明天也还是崭新的一天。',
  '我在这里，不问你吃了什么，只想陪你聊聊天。',
  '喝口水，深呼吸，我们按自己的节奏来。',
];

export const sassyLines: string[] = [
  '哟，来了？我正想说今天没人陪我聊天呢。',
  '吃就吃了呗，记下来这么萌的行为谁不爱看。',
  '别一脸心虚，你又不是偷了全世界的蛋糕。',
  '我今天的状态是：等你来给我讲讲好吃的。',
  '管它热量多少，诚实的人类最迷人，懂？',
  '你那点小嘴馋，还不够我塞牙缝的，记录走起。',
  '别犹豫啦，点一下拍照，我给你打分——满分是勇气分。',
  '谁规定减肥就得苦着脸？我第一个不同意。',
  '放纵餐怎么了，那是你和生活和解的证据。',
  '好了好了，别盯着我，去把今天的快乐记下来。',
];

export const funnyLines: string[] = [
  '噔噔！我是你的分身，专门负责替你开心。',
  '我刚刚偷偷练了一个饱嗝，现在表演给你看：嗝～',
  '据可靠消息，你今天的味蕾正在申请加薪。',
  '如果开心有热量，你今天肯定超标——开心的那种！',
  '我决定宣布：今天是与蔬菜和平共处纪念日。',
  '馋了？来，我们先对着屏幕做三秒气球人。',
  '我的肚子是道具，你的肚子是主角，别搞混了。',
  '报告！检测到一名人类正在犹豫要不要记录，请求鼓励。',
  '放心，我这个分身只负责鼓掌，不负责记账本。',
  '你要是吃了蛋糕，我就假装那也是我的那份。',
];

export const cheatLines: string[] = [
  '嗝～这份满足我收到了，快乐也收到了。',
  '好吃到打了个小嗝，明天我们照常见面。',
  '嗯……这一餐很幸福，我决定把它记进小本本。',
  '吃饱了就想睡觉，分身眯一会儿，你慢慢来。',
];

export const missingLines: string[] = [
  '想你了，刚刚还在数你几天没来找我呢。',
  '你不在的时候，我把阳光数了一遍又一遍。',
  '回来啦？我这里一直留着你的位置。',
  '没关系，我们重新从一句你好开始。',
];

export const greetingLines: string[] = [
  '早上好呀，今天也要开开心心地吃饭。',
  '下午好，来一口快乐补充剂怎么样？',
  '晚上好，今天辛苦啦，先坐下来歇歇。',
  '嗨，我在等你分享今天的第一口好味道。',
];

export const workoutLines: Record<Personality, string[]> = {
  gentle: [
    '今天我给你挑了一套轻轻的方案，舒服地动一动就好。',
    '不用做到完美，跟着做完一小段就已经很棒了。',
    '如果中间想停下来喝口水，我们随时可以。',
    '身体今天想怎么动，我们就怎么来，慢慢找到节奏。',
    '这套动作很温柔，做完记得夸夸自己。',
    '好啦，换上舒服的衣服，我陪你一起开始。',
  ],
  sassy: [
    '安排好了，别摆出一副要上战场的表情，就是动一动嘛。',
    '这套不搞折磨人那套，做完你还愿意跟我聊天就行。',
    '别小看这几分钟，认真起来还是挺有模有样的。',
    '动作做不标准也没事，反正我又不在旁边打分。',
    '去动一动吧，回来我还有一堆好吃的等你记。',
    '好了好了，教练上线，抱怨的话先暂停三分钟。',
  ],
  funny: [
    '登登！今日训练盲盒拆开啦，是这套！',
    '我宣布：接下来这几分钟，客厅暂时归你表演。',
    '这套动作很简单，简单到我都想跟着做两下。',
    '做好准备，我们要开始把沙发变成健身器材了。',
    '如果动作做得奇怪，别担心，那叫个人风格。',
    '做完记得喘口气，我负责在旁边假装鼓掌。',
  ],
};

export const lowBarrierLines: string[] = [
  '今天我们只做一点点就好，先让身体醒过来。',
  '这套只要 5 分钟，坐着开始也没关系。',
  '不用着急，慢慢走几个动作就算数。',
  '今天状态一般的话，我们就有多轻做多轻。',
  '先把垫子铺好，剩下的交给这几分钟。',
];

export function getWorkoutLine(personality: Personality): string {
  const list = workoutLines[personality];
  return list[Math.floor(Math.random() * list.length)];
}

export function getLowBarrierLine(): string {
  return lowBarrierLines[Math.floor(Math.random() * lowBarrierLines.length)];
}

const pool: Record<Personality, string[]> = {
  gentle: gentleLines,
  sassy: sassyLines,
  funny: funnyLines,
};

export function getAvatarLine(personality: Personality, context?: 'cheat' | 'missing'): string {
  const list = context === 'cheat' ? cheatLines : context === 'missing' ? missingLines : pool[personality];
  return list[Math.floor(Math.random() * list.length)];
}

export function getAllLines(personality: Personality): string[] {
  return pool[personality];
}
