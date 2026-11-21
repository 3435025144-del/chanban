import { useRef, useState, type PointerEvent } from 'react';
import html2canvas from 'html2canvas';
import Hamster from './Hamster';
import Icon from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  photos: { src: string; time?: string; calories: number; name: string }[];
  dateLabel: string;
  totalCalories: number;
  mealCount: number;
}

interface Sticker { id: number; emoji: string; x: number; y: number; size: number; rotate: number }
interface DragState { id: number; startX: number; startY: number; origX: number; origY: number; moved: boolean }
interface ResizeState { id: number; startX: number; origSize: number }

const healingLines = [
  '好好吃饭，就是爱自己的第一步。',
  '每一口认真吃下的饭，都算数。',
  '记录生活的温度，从这一餐开始。',
  '你照顾好自己的样子，真好看。',
];
const stickerPalette = ['🍔', '🍓', '☕️', '😋', '✨', '💖', '🐹', '🐾'];
const photoTilts = [-3, 4, -2, 3];

export default function JournalPreview({ open, onClose, photos, dateLabel, totalCalories, mealCount }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [saving, setSaving] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null);
  const line = healingLines[photos.length % healingLines.length];

  if (!open) return null;

  const addSticker = (emoji: string) => {
    const id = Date.now() + Math.random();
    setStickers((list) => [
      ...list,
      { id, emoji, x: 12 + Math.random() * 74, y: 14 + Math.random() * 60, size: 22 + Math.round(Math.random() * 16), rotate: Math.round(Math.random() * 50 - 25) },
    ]);
    setSelectedStickerId(id);
  };

  const onStickerDown = (event: PointerEvent<HTMLDivElement>, sticker: Sticker) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: sticker.id, startX: event.clientX, startY: event.clientY, origX: sticker.x, origY: sticker.y, moved: false };
  };
  const onStickerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !cardRef.current) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, drag.origX + (dx / rect.width) * 100));
    const y = Math.max(6, Math.min(94, drag.origY + (dy / rect.height) * 100));
    setStickers((list) => list.map((item) => item.id === drag.id ? { ...item, x, y } : item));
  };
  const onStickerUp = (event: PointerEvent<HTMLDivElement>, sticker: Sticker) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag && !drag.moved) setSelectedStickerId(sticker.id);
  };

  const onResizeDown = (event: PointerEvent<HTMLButtonElement>, sticker: Sticker) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { id: sticker.id, startX: event.clientX, origSize: sticker.size };
  };
  const onResizeMove = (event: PointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    const size = Math.max(16, Math.min(64, Math.round(resize.origSize + (event.clientX - resize.startX) * 0.4)));
    setStickers((list) => list.map((item) => item.id === resize.id ? { ...item, size } : item));
  };
  const onResizeUp = (event: PointerEvent<HTMLButtonElement>) => {
    resizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const removeSticker = (id: number) => {
    setStickers((list) => list.filter((item) => item.id !== id));
    setSelectedStickerId(null);
  };

  const save = async () => {
    if (!cardRef.current || saving) return;
    setSelectedStickerId(null);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#FBF6EA', scale: 2, useCORS: true });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `馋伴手账-${dateLabel}.png`;
      link.href = url;
      link.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
        <div className="w-full max-w-[430px]">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[15px] font-bold text-white">专属手账预览</span>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white" aria-label="关闭"><Icon name="close" size={18} /></button>
          </div>

          <div ref={cardRef} className="journal-card relative mx-auto w-full overflow-hidden rounded-[24px]" style={{ aspectRatio: '3 / 4' }}>
            <div className="journal-grid absolute inset-0 z-0" />
            <div className="relative z-[1] flex h-full flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-widest text-[#8a7a5a]">CHANBAN · 今日食光</p>
                  <p className="mt-1 text-[20px] font-extrabold text-[#3a3327]">{dateLabel}</p>
                </div>
                <Hamster size={54} mood="cheer" className="ring-4 ring-white/70" />
              </div>

              <div className="journal-photos relative z-[1] mt-3 min-h-0 flex-1">
                {photos.map((photo, i) => (
                  <div key={`${photo.src}-${i}`} className="journal-photo" style={{ transform: `rotate(${photoTilts[i % photoTilts.length]}deg)` }}>
                    <span className="journal-tape" />
                    <img src={photo.src} alt={photo.name} className="h-full w-full object-cover" crossOrigin="anonymous" />
                    {photo.time && <span className="journal-photo-time">{photo.time} · {photo.calories} kcal</span>}
                  </div>
                ))}
              </div>

              <div className="relative z-[2] mt-2 shrink-0">
                <p className="journal-handwriting">{line}</p>
                <p className="mt-1 text-right text-[10px] text-[#9a8a6a]">— 小馋 · 陪你好好吃饭</p>
              </div>
            </div>

            <div className="journal-stamp z-[3]">
              <span className="journal-stamp-top">今日摄入</span>
              <span className="journal-stamp-value tabular-nums">{totalCalories} kcal</span>
              <span className="journal-stamp-bottom">记录 {mealCount} 餐</span>
            </div>

            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                onPointerDown={(event) => onStickerDown(event, sticker)}
                onPointerMove={onStickerMove}
                onPointerUp={(event) => onStickerUp(event, sticker)}
                onPointerCancel={(event) => onStickerUp(event, sticker)}
                className={`journal-sticker z-[4] ${selectedStickerId === sticker.id ? 'journal-sticker-selected' : ''}`}
                style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, fontSize: sticker.size, transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg)` }}
                role="img"
                aria-label="拖动贴纸，点击选中"
              >
                {sticker.emoji}
                {selectedStickerId === sticker.id && (
                  <>
                    <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeSticker(sticker.id)} className="journal-sticker-remove" aria-label="删除贴纸">×</button>
                    <button
                      type="button"
                      onPointerDown={(event) => onResizeDown(event, sticker)}
                      onPointerMove={onResizeMove}
                      onPointerUp={onResizeUp}
                      onPointerCancel={onResizeUp}
                      className="journal-sticker-resize"
                      aria-label="拖动缩放贴纸"
                    >↘</button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="journal-sticker-bar mt-3 rounded-[24px] p-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {stickerPalette.map((emoji) => (
                <button key={emoji} type="button" onClick={() => addSticker(emoji)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-2xl active:scale-95">{emoji}</button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-textMuted">点贴纸添加 · 拖动可移动 · 点选后可缩放/删除</p>
          </div>

          <button onClick={save} disabled={saving} className="journal-save-btn mt-3 w-full rounded-[18px] py-3.5 text-[15px] font-extrabold shadow-modal active:scale-[0.98] disabled:opacity-60">{saving ? '正在保存…' : '保存到相册'}</button>
        </div>
      </div>
    </div>
  );
}
