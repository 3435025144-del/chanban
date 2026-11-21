export interface FaceOption { id: string; label: string; rx: number; ry: number }
export interface HairOption { id: string; label: string; color: string }
export interface SkinOption { id: string; label: string; color: string }
export interface OutfitOption { id: string; label: string; color: string; accent: string }
export interface BottomOption { id: string; label: string; color: string; accent: string }
export interface ShoesOption { id: string; label: string; color: string; accent: string }
export interface AccessoryOption { id: string; label: string }
export interface SceneOption { id: string; label: string; from: string; to: string }
export interface ActionOption { id: string; label: string }

export const faceOptions: FaceOption[] = [
  { id: 'round', label: '圆圆的', rx: 47, ry: 49 },
  { id: 'oval', label: '鹅蛋脸', rx: 43, ry: 52 },
  { id: 'square', label: '方方的', rx: 46, ry: 46 },
  { id: 'heart', label: '小V脸', rx: 45, ry: 51 },
  { id: 'long', label: '长脸蛋', rx: 40, ry: 55 },
];

export const hairOptions: HairOption[] = [
  { id: 'bob', label: '波波头', color: '#E8C46F' },
  { id: 'ponytail', label: '马尾', color: '#5C4033' },
  { id: 'short', label: '短发', color: '#3E312C' },
  { id: 'bun', label: '丸子头', color: '#564037' },
  { id: 'wavy', label: '小卷发', color: '#E99AAA' },
  { id: 'none', label: '光头', color: 'transparent' },
  { id: 'hairX01', label: '奶油短发', color: '#F5D6A8' },
  { id: 'hairX02', label: '蜜糖卷', color: '#D9A15B' },
  { id: 'hairX03', label: '亚麻波波', color: '#C9B18B' },
  { id: 'hairX04', label: '雾蓝短发', color: '#8FA9C4' },
  { id: 'hairX05', label: '樱花双马尾', color: '#F4AFC4' },
  { id: 'hairX06', label: '抹茶丸子', color: '#9BBF8B' },
  { id: 'hairX07', label: '栗子盘发', color: '#8B5E3C' },
  { id: 'hairX08', label: '海盐卷', color: '#A8C7C2' },
  { id: 'hairX09', label: '葡萄紫长发', color: '#8E6FA8' },
  { id: 'hairX10', label: '蜜桃侧马尾', color: '#F3B08E' },
  { id: 'hairX11', label: '柠檬寸头', color: '#E8D36A' },
  { id: 'hairX12', label: '可可微卷', color: '#6E4B3A' },
  { id: 'hairX13', label: '银灰短碎', color: '#BFC3C7' },
  { id: 'hairX14', label: '珊瑚妹妹头', color: '#F28B82' },
  { id: 'hairX15', label: '蓝莓公主切', color: '#6E7FB8' },
  { id: 'hairX16', label: '卡其脏辫', color: '#A88B5C' },
  { id: 'hairX17', label: '玫瑰大波浪', color: '#D97A97' },
  { id: 'hairX18', label: '燕麦半扎', color: '#D8C8A8' },
  { id: 'hairX19', label: '薄荷小揪揪', color: '#9FD8C0' },
  { id: 'hairX20', label: '焦糖泡面头', color: '#B87A4C' },
];

export const skinOptions: SkinOption[] = [
  { id: 'ivory', label: '奶油白', color: '#FFE4D2' },
  { id: 'warm', label: '暖蜜色', color: '#FFE1CB' },
  { id: 'honey', label: '蜂蜜色', color: '#E9AE82' },
  { id: 'tan', label: '小麦色', color: '#CF8E63' },
  { id: 'rose', label: '粉粉的', color: '#FFD6C6' },
];

export const outfitOptions: OutfitOption[] = [
  { id: 'teeCoral', label: '橘子汽水T', color: '#FF8B72', accent: '#FFE0D5' },
  { id: 'hoodie', label: '慵懒连帽衫', color: '#F6D36B', accent: '#FFF0A8' },
  { id: 'sports', label: '元气运动服', color: '#7FA8E8', accent: '#E3EDFF' },
  { id: 'dress', label: '草莓小裙子', color: '#F39AB2', accent: '#FFDCE7' },
  { id: 'stripe', label: '海盐条纹衫', color: '#F4F0E6', accent: '#6FA9C9' },
  { id: 'coat', label: '焦糖小外套', color: '#C98F5E', accent: '#F7E6D4' },
  { id: 'outfitX01', label: '奶黄卫衣', color: '#F6D36B', accent: '#FFF0A8' },
  { id: 'outfitX02', label: '薄荷针织', color: '#A8D8C4', accent: '#E0F4EA' },
  { id: 'outfitX03', label: '樱花衬衫', color: '#F5AFC4', accent: '#FFE0E9' },
  { id: 'outfitX04', label: '海盐背心', color: '#9FC3D8', accent: '#E4F1F8' },
  { id: 'outfitX05', label: '焦糖毛衣', color: '#C98F5E', accent: '#F7E6D4' },
  { id: 'outfitX06', label: '葡萄Polo', color: '#8E6FA8', accent: '#E4D8F0' },
  { id: 'outfitX07', label: '蜜桃T恤', color: '#F3B08E', accent: '#FFE4D6' },
  { id: 'outfitX08', label: '抹茶外套', color: '#9BBF8B', accent: '#E4F0DC' },
  { id: 'outfitX09', label: '柠檬雨衣', color: '#E8D36A', accent: '#FFF6B8' },
  { id: 'outfitX10', label: '可可马甲', color: '#8B5E3C', accent: '#D8C0AC' },
  { id: 'outfitX11', label: '蓝莓卫衣', color: '#6E7FB8', accent: '#DCE3F4' },
  { id: 'outfitX12', label: '珊瑚开衫', color: '#F28B82', accent: '#FFE0DC' },
  { id: 'outfitX13', label: '燕麦风衣', color: '#D8C8A8', accent: '#F3ECDC' },
  { id: 'outfitX14', label: '玫瑰旗袍', color: '#D97A97', accent: '#FBE0E9' },
  { id: 'outfitX15', label: '银灰西装', color: '#BFC3C7', accent: '#EDEFF1' },
  { id: 'outfitX16', label: '薄荷睡衣', color: '#A8D8C4', accent: '#EAF7F1' },
  { id: 'outfitX17', label: '栗子连帽衫', color: '#A87C5B', accent: '#EAD9C7' },
  { id: 'outfitX18', label: '奶油束腰衫', color: '#F2E4D0', accent: '#FFF8EA' },
  { id: 'outfitX19', label: '青柠背带装', color: '#B6D36A', accent: '#EAF5C8' },
  { id: 'outfitX20', label: '雾紫羽绒服', color: '#AFA2C9', accent: '#E8E2F2' },
];

export const bottomOptions: BottomOption[] = [
  { id: 'shortsMix', label: '拼色短裤', color: '#A7A5D8', accent: '#B8D7CF' },
  { id: 'shortsNavy', label: '深蓝短裤', color: '#4C5A8A', accent: '#7D88B8' },
  { id: 'skirtDenim', label: '牛仔短裙', color: '#7FA8C9', accent: '#BFD7EA' },
  { id: 'pantsLinen', label: '亚麻长裤', color: '#E3D9C6', accent: '#CFC1A8' },
  { id: 'bottomX01', label: '奶油短裙', color: '#F2E4D0', accent: '#FFF8EA' },
  { id: 'bottomX02', label: '薄荷长裤', color: '#A8D8C4', accent: '#E0F4EA' },
  { id: 'bottomX03', label: '樱花百褶', color: '#F5AFC4', accent: '#FFE0E9' },
  { id: 'bottomX04', label: '海盐阔腿裤', color: '#9FC3D8', accent: '#E4F1F8' },
  { id: 'bottomX05', label: '焦糖短裤', color: '#C98F5E', accent: '#F7E6D4' },
  { id: 'bottomX06', label: '葡萄牛仔裤', color: '#8E6FA8', accent: '#E4D8F0' },
  { id: 'bottomX07', label: '蜜桃半裙', color: '#F3B08E', accent: '#FFE4D6' },
  { id: 'bottomX08', label: '抹茶工装裤', color: '#9BBF8B', accent: '#E4F0DC' },
  { id: 'bottomX09', label: '柠檬背带裤', color: '#E8D36A', accent: '#FFF6B8' },
  { id: 'bottomX10', label: '可可直筒裤', color: '#8B5E3C', accent: '#D8C0AC' },
  { id: 'bottomX11', label: '蓝莓短裙', color: '#6E7FB8', accent: '#DCE3F4' },
  { id: 'bottomX12', label: '珊瑚打底裤', color: '#F28B82', accent: '#FFE0DC' },
  { id: 'bottomX13', label: '燕麦长裙', color: '#D8C8A8', accent: '#F3ECDC' },
  { id: 'bottomX14', label: '玫瑰纱裙', color: '#D97A97', accent: '#FBE0E9' },
  { id: 'bottomX15', label: '银灰西裤', color: '#BFC3C7', accent: '#EDEFF1' },
  { id: 'bottomX16', label: '薄荷短裤', color: '#9FD8C0', accent: '#E6F6EF' },
  { id: 'bottomX17', label: '栗子灯笼裤', color: '#A87C5B', accent: '#EAD9C7' },
  { id: 'bottomX18', label: '奶油喇叭裤', color: '#F2E4D0', accent: '#FFF8EA' },
  { id: 'bottomX19', label: '青柠运动裤', color: '#B6D36A', accent: '#EAF5C8' },
  { id: 'bottomX20', label: '雾紫哈伦裤', color: '#AFA2C9', accent: '#E8E2F2' },
];

export const shoesOptions: ShoesOption[] = [
  { id: 'sneaker', label: '奶白球鞋', color: '#EDE6DE', accent: '#F4A46D' },
  { id: 'boots', label: '奶油短靴', color: '#D8C6A8', accent: '#A98862' },
  { id: 'sandals', label: '轻快凉鞋', color: '#C7DDD5', accent: '#8FB9AA' },
  { id: 'shoesX01', label: '奶油乐福鞋', color: '#F2E4D0', accent: '#C9A66B' },
  { id: 'shoesX02', label: '薄荷帆布鞋', color: '#A8D8C4', accent: '#6FA98C' },
  { id: 'shoesX03', label: '樱花玛丽珍', color: '#F5AFC4', accent: '#D97A97' },
  { id: 'shoesX04', label: '海盐凉拖', color: '#9FC3D8', accent: '#6F98B8' },
  { id: 'shoesX05', label: '焦糖短靴', color: '#C98F5E', accent: '#8B5E3C' },
  { id: 'shoesX06', label: '葡萄老爹鞋', color: '#8E6FA8', accent: '#6C5285' },
  { id: 'shoesX07', label: '蜜桃芭蕾鞋', color: '#F3B08E', accent: '#D8896A' },
  { id: 'shoesX08', label: '抹茶板鞋', color: '#9BBF8B', accent: '#6F9363' },
  { id: 'shoesX09', label: '柠檬雨靴', color: '#E8D36A', accent: '#C0A83C' },
  { id: 'shoesX10', label: '可可豆豆鞋', color: '#8B5E3C', accent: '#6E4B3A' },
  { id: 'shoesX11', label: '蓝莓运动鞋', color: '#6E7FB8', accent: '#4C5A8A' },
  { id: 'shoesX12', label: '珊瑚凉鞋', color: '#F28B82', accent: '#D36A62' },
  { id: 'shoesX13', label: '燕麦雪地靴', color: '#D8C8A8', accent: '#B8A684' },
  { id: 'shoesX14', label: '玫瑰高跟鞋', color: '#D97A97', accent: '#B85C7C' },
  { id: 'shoesX15', label: '银灰皮鞋', color: '#BFC3C7', accent: '#8A8F95' },
  { id: 'shoesX16', label: '薄荷洞洞鞋', color: '#9FD8C0', accent: '#6FA98C' },
  { id: 'shoesX17', label: '栗子棉鞋', color: '#A87C5B', accent: '#7A543B' },
  { id: 'shoesX18', label: '奶油渔夫鞋', color: '#F2E4D0', accent: '#C9A66B' },
  { id: 'shoesX19', label: '青柠滑板鞋', color: '#B6D36A', accent: '#8CAA46' },
  { id: 'shoesX20', label: '雾紫拖鞋', color: '#AFA2C9', accent: '#8274A3' },
];

export const accessoryOptions: AccessoryOption[] = [
  { id: 'none', label: '不戴' },
  { id: 'glasses', label: '圆框眼镜' },
  { id: 'bow', label: '蝴蝶结' },
  { id: 'hat', label: '小黄帽' },
  { id: 'hairpin', label: '发夹' },
  { id: 'earrings', label: '小耳环' },
];

export const backgroundOptions: SceneOption[] = [
  { id: 'sunny', label: '晴天', from: '#FFF1DC', to: '#FFD9C2' },
  { id: 'mint', label: '薄荷', from: '#E7F9F2', to: '#C4EEE0' },
  { id: 'sunset', label: '晚霞', from: '#FFE0E6', to: '#FFC3A8' },
  { id: 'night', label: '星空', from: '#DDE4FF', to: '#B9C6F5' },
  { id: 'cloud', label: '云端', from: '#EDF6FF', to: '#D6E9FF' },
];

export const actionOptions: ActionOption[] = [
  { id: 'none', label: '自然' },
  { id: 'sparkle', label: '闪闪发光' },
  { id: 'blush', label: '害羞' },
  { id: 'sleepy', label: '打个小嗝' },
  { id: 'wave', label: '挥挥手' },
];
