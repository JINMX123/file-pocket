import { motion } from 'framer-motion'
import type { PocketTheme } from '@/lib/model'

export type PocketMood = 'idle' | 'curious' | 'hungry' | 'eating'

/** 口袋小挂件的脸：一只张着袋口的圆口袋 */
export function PocketFace({ mood, size = 76, theme }: { mood: PocketMood; size?: number; theme: PocketTheme }) {
  const open = mood === 'hungry' || mood === 'eating'
  const big = mood === 'eating'
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 76 76"
      animate={mood === 'idle' ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={
        mood === 'idle'
          ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 400, damping: 20 }
      }
      aria-hidden
    >
      {/* 袋身 */}
      <path
        d="M10 30 Q8 14 24 12 h28 Q68 14 66 30 v18 q0 16 -16 16 H26 q-16 0 -16 -16 Z"
        fill={theme.body}
        style={{ transition: 'fill .3s' }}
      />
      <path d="M10 30 Q8 14 24 12 h28 Q68 14 66 30 v4 H10 Z" fill={theme.bodyLight} style={{ transition: 'fill .3s' }} />
      {/* 袋口 */}
      <motion.ellipse
        cx="38"
        cy="34"
        fill={theme.mouth}
        style={{ transition: 'fill .3s' }}
        animate={{ ry: open ? (big ? 13 : 10) : 2.2, rx: open ? (big ? 17 : 14) : 11 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      />
      {/* 眼睛 */}
      <motion.circle
        cx="26"
        cy="48"
        r={open ? 4 : 3.2}
        fill="#fff"
        animate={mood === 'curious' ? { cx: [26, 28, 26] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <motion.circle
        cx="50"
        cy="48"
        r={open ? 4 : 3.2}
        fill="#fff"
        animate={mood === 'curious' ? { cx: [50, 52, 50] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <circle cx="27" cy="48.5" r="1.6" fill="#232946" />
      <circle cx="51" cy="48.5" r="1.6" fill="#232946" />
      {/* 腮红 */}
      <circle cx="19" cy="55" r="3" fill={theme.blush} opacity=".8" style={{ transition: 'fill .3s' }} />
      <circle cx="57" cy="55" r="3" fill={theme.blush} opacity=".8" style={{ transition: 'fill .3s' }} />
    </motion.svg>
  )
}

/** 拖拽文件靠近时，口袋张开的「投喂」状态卡片 */
export function HungryCard({
  fileName,
  targetName,
  targetColor,
  keyword,
  theme,
}: {
  fileName: string
  targetName: string
  targetColor: string
  keyword: string | null
  theme: PocketTheme
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className="pointer-events-none absolute bottom-[92px] right-0 w-64 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-xl shadow-indigo-200/40 backdrop-blur-xl"
    >
      <div className="mb-2 text-[13px] font-medium text-neutral-500">松手即归档</div>
      <div className="mb-3 truncate rounded-xl bg-neutral-100/80 px-3 py-2 text-[13px] font-medium text-neutral-800">
        {fileName}
      </div>
      <div className="flex items-center gap-2">
        <motion.span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: targetColor }}
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        <span className="text-sm font-semibold text-neutral-900">{targetName}</span>
      </div>
      {keyword ? (
        <div className="mt-2 text-xs text-neutral-500">
          识别关键词
          <mark
            className="ml-1 rounded-md px-1.5 py-0.5 font-medium"
            style={{ background: theme.chipBg, color: theme.chipText }}
          >
            {keyword}
          </mark>
        </div>
      ) : (
        <div className="mt-2 text-xs text-neutral-400">未命中规则，放入待分类</div>
      )}
    </motion.div>
  )
}

/** 被吸入的文件残影 */
export function SwallowGhost({
  name,
  from,
  to,
  onDone,
}: {
  name: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  onDone: () => void
}) {
  return (
    <motion.div
      className="pointer-events-none fixed z-[60] max-w-56 truncate rounded-2xl border border-white/60 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur"
      initial={{ x: from.x - 80, y: from.y - 20, scale: 1, opacity: 1, rotate: 0 }}
      animate={{ x: to.x - 80, y: to.y - 20, scale: 0.15, opacity: 0.4, rotate: 14 }}
      transition={{ duration: 0.42, ease: [0.5, 0, 0.75, 0.4] }}
      onAnimationComplete={onDone}
    >
      {name}
    </motion.div>
  )
}
