import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import {
  classify,
  basename,
  DEFAULT_FOLDERS,
  THEMES,
  FOLDER_COLORS,
  type PocketConfig,
  type PocketTheme,
  type RuleFolder,
} from '@/lib/model'
import { PocketFace, type PocketMood } from '@/components/PocketBits'
import { DesktopPanel } from '@/components/DesktopPanel'

const SLEEP_AFTER_MS = 30_000
const isTauri = '__TAURI_INTERNALS__' in window

interface MoveResult {
  src: string
  dest: string | null
  error: string | null
}

interface Toast {
  id: number
  text: string
  color: string
}

export default function App() {
  const [folders, setFolders] = useState<RuleFolder[]>(DEFAULT_FOLDERS)
  const [themeId, setThemeId] = useState(THEMES[0].id)
  const [panelOpen, setPanelOpen] = useState(false)
  const [hoverPaths, setHoverPaths] = useState<string[] | null>(null)
  const [sleeping, setSleeping] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [configLoaded, setConfigLoaded] = useState(false)
  const toastId = useRef(0)

  const theme: PocketTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]

  const pushToast = useCallback((text: string, color: string) => {
    const id = ++toastId.current
    setToasts((t) => [...t.slice(-2), { id, text, color }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // 启动：从应用配置目录读取规则与皮肤
  useEffect(() => {
    if (!isTauri) {
      setConfigLoaded(true)
      return
    }
    invoke<string>('load_config')
      .then((raw) => {
        if (raw) {
          const cfg = JSON.parse(raw) as PocketConfig
          if (Array.isArray(cfg.folders) && cfg.folders.length) setFolders(cfg.folders)
          if (cfg.themeId) setThemeId(cfg.themeId)
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true))
  }, [])

  // 配置变化后持久化（防抖）
  useEffect(() => {
    if (!configLoaded || !isTauri) return
    const t = window.setTimeout(() => {
      const cfg: PocketConfig = { folders, themeId }
      invoke('save_config', { json: JSON.stringify(cfg) }).catch(() => {})
    }, 600)
    return () => window.clearTimeout(t)
  }, [folders, themeId, configLoaded])

  // 真实拖拽：监听操作系统文件拖入窗口
  useEffect(() => {
    if (!isTauri) return
    let unlisten: (() => void) | undefined
    getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        const p = event.payload
        if (p.type === 'enter') {
          setHoverPaths(p.paths)
        } else if (p.type === 'over') {
          // over 不带 paths，保持进入时记录的路径即可
        } else if (p.type === 'leave') {
          setHoverPaths(null)
        } else if (p.type === 'drop') {
          setHoverPaths(null)
          handleDrop(p.paths)
        }
      })
      .then((u) => (unlisten = u))
    return () => unlisten?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders])

  const handleDrop = useCallback(
    async (paths: string[]) => {
      if (!isTauri || paths.length === 0) return
      // 按目标文件夹分组
      const groups = new Map<string, { folder: RuleFolder; paths: string[] }>()
      for (const p of paths) {
        const { folder } = classify(basename(p), folders)
        const g = groups.get(folder.id) ?? { folder, paths: [] }
        g.paths.push(p)
        groups.set(folder.id, g)
      }
      for (const { folder, paths: ps } of groups.values()) {
        try {
          const results = await invoke<MoveResult[]>('move_files', { paths: ps, destDir: folder.path })
          const ok = results.filter((r) => !r.error).length
          const fail = results.length - ok
          if (ok > 0) pushToast(`${ok} 个文件 → ${folder.name}`, folder.color)
          if (fail > 0) pushToast(`${fail} 个文件移动失败`, '#e11d48')
        } catch (e) {
          pushToast(`归档失败：${String(e)}`, '#e11d48')
        }
      }
    },
    [folders, pushToast],
  )

  // 休眠：30 秒无操作 → 窗口停靠到屏幕右缘，只露挂扣
  const idleActive = panelOpen || !!hoverPaths
  useEffect(() => {
    if (idleActive) {
      setSleeping(false)
      return
    }
    let timer = 0
    const reset = () => {
      setSleeping(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setSleeping(true), SLEEP_AFTER_MS)
    }
    reset()
    window.addEventListener('pointermove', reset)
    window.addEventListener('pointerdown', reset)
    window.addEventListener('keydown', reset)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', reset)
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [idleActive])

  useEffect(() => {
    if (isTauri) invoke('dock_window', { docked: sleeping }).catch(() => {})
  }, [sleeping])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const mood: PocketMood = hoverPaths ? 'hungry' : 'idle'
  const liveMatch = useMemo(
    () => (hoverPaths && hoverPaths.length > 0 ? classify(basename(hoverPaths[0]), folders) : null),
    [hoverPaths, folders],
  )

  // 规则操作
  const addKeyword = useCallback((id: string, kw: string) => {
    setFolders((fs) => fs.map((f) => (f.id === id && !f.keywords.includes(kw) ? { ...f, keywords: [...f.keywords, kw] } : f)))
  }, [])
  const removeKeyword = useCallback((id: string, kw: string) => {
    setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, keywords: f.keywords.filter((k) => k !== kw) } : f)))
  }, [])
  const addFolder = useCallback(
    (name: string, path: string) => {
      setFolders((fs) => {
        const inbox = fs.find((f) => f.id === 'inbox')!
        const rest = fs.filter((f) => f.id !== 'inbox')
        return [...rest, { id: 'f' + Date.now().toString(36), name, path, color: FOLDER_COLORS[rest.length % FOLDER_COLORS.length], keywords: [] }, inbox]
      })
      pushToast(`已创建文件夹「${name}」`, '#4fb286')
    },
    [pushToast],
  )
  const updatePath = useCallback((id: string, path: string) => {
    setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, path } : f)))
  }, [])
  const openFolder = useCallback((path: string) => {
    if (isTauri) invoke('open_folder', { path }).catch((e) => pushToast(`打开失败：${String(e)}`, '#e11d48'))
  }, [pushToast])

  return (
    <div className="relative h-full w-full">
      {/* 投喂预览 */}
      <AnimatePresence>
        {hoverPaths && liveMatch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="pointer-events-none absolute bottom-[190px] right-0 w-64 rounded-3xl border border-white/60 bg-white/85 p-4 shadow-xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="mb-2 text-[13px] font-medium text-neutral-500">
              松手归档 {hoverPaths.length} 个文件
            </div>
            <div className="mb-3 truncate rounded-xl bg-neutral-100/80 px-3 py-2 text-[13px] font-medium text-neutral-800">
              {basename(hoverPaths[0])}
              {hoverPaths.length > 1 ? ` 等 ${hoverPaths.length} 项` : ''}
            </div>
            <div className="flex items-center gap-2">
              <motion.span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: liveMatch.folder.color }}
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span className="text-sm font-semibold text-neutral-900">{liveMatch.folder.name}</span>
            </div>
            {liveMatch.keyword ? (
              <div className="mt-2 text-xs text-neutral-500">
                识别关键词
                <span className="ml-1 rounded-md px-1.5 py-0.5 font-medium" style={{ background: theme.chipBg, color: theme.chipText }}>
                  {liveMatch.keyword}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-neutral-400">未命中规则，放入待分类</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 面板 */}
      <DesktopPanel
        open={panelOpen}
        folders={folders}
        theme={theme}
        onClose={() => setPanelOpen(false)}
        onThemeChange={setThemeId}
        onOpenFolder={openFolder}
        onAddKeyword={addKeyword}
        onRemoveKeyword={removeKeyword}
        onAddFolder={addFolder}
        onUpdatePath={updatePath}
      />

      {/* 口袋本体（右下角） */}
      <motion.button
        onClick={() => setPanelOpen((o) => !o)}
        className="absolute bottom-0 right-0 block rounded-[26px] border border-white/70 bg-white/60 p-1 shadow-xl shadow-black/20 backdrop-blur-xl"
        animate={hoverPaths ? { scale: 1.16, rotate: [0, -3, 3, 0] } : { scale: 1, rotate: 0 }}
        transition={
          hoverPaths
            ? { scale: { type: 'spring', stiffness: 300, damping: 14 }, rotate: { duration: 0.5, repeat: Infinity } }
            : { type: 'spring', stiffness: 300, damping: 20 }
        }
        whileTap={{ scale: 0.92 }}
        aria-label="文件口袋"
      >
        <PocketFace mood={mood} size={76} theme={theme} />
      </motion.button>

      {/* 休眠挂扣：停靠在窗口右缘 */}
      <AnimatePresence>
        {sleeping && (
          <motion.button
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 }}
            onClick={() => setSleeping(false)}
            onMouseEnter={() => setSleeping(false)}
            className="absolute bottom-2 right-0 flex h-16 w-[20px] flex-col items-center justify-center gap-1.5 rounded-l-2xl border-y border-l border-white/70 shadow-lg backdrop-blur-xl"
            style={{ background: theme.body, transition: 'background .3s' }}
            aria-label="叫醒口袋"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 提示条 */}
      <div className="pointer-events-none absolute bottom-24 right-2 flex flex-col items-end gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className="flex items-center gap-2 rounded-full border border-white/60 bg-white/90 py-2 pl-3 pr-4 text-[13px] font-medium text-neutral-800 shadow-lg backdrop-blur-xl"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 浏览器里打开时的提示（正常不会出现在打包应用中） */}
      {!isTauri && (
        <div className="absolute left-2 top-2 max-w-64 rounded-2xl bg-amber-50/95 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700 shadow">
          浏览器预览模式：真实拖拽归档、托盘与边缘停靠需在打包后的桌面应用中运行。
        </div>
      )}
    </div>
  )
}
