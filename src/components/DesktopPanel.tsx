import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PocketTheme, RuleFolder } from '@/lib/model'
import { THEMES } from '@/lib/model'
import { folderSvg } from './FileTypeIcon'
import { PocketFace } from './PocketBits'

interface PanelProps {
  open: boolean
  folders: RuleFolder[]
  theme: PocketTheme
  onClose: () => void
  onThemeChange: (id: string) => void
  onOpenFolder: (path: string) => void
  onAddKeyword: (folderId: string, kw: string) => void
  onRemoveKeyword: (folderId: string, kw: string) => void
  onAddFolder: (name: string, path: string) => void
  onUpdatePath: (folderId: string, path: string) => void
}

export function DesktopPanel({
  open,
  folders,
  theme,
  onClose,
  onThemeChange,
  onOpenFolder,
  onAddKeyword,
  onRemoveKeyword,
  onAddFolder,
  onUpdatePath,
}: PanelProps) {
  const [tab, setTab] = useState<'folders' | 'rules'>('folders')
  const [themeOpen, setThemeOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRoot, setNewRoot] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [kwDraft, setKwDraft] = useState<Record<string, string>>({})

  const rootOptions = useMemo(() => {
    const roots = new Set<string>()
    for (const f of folders) {
      const p = f.path.replace(/[\\/]+$/, '')
      const i = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'))
      if (i > 0) roots.add(p.slice(0, i))
    }
    roots.add('D:\\工作')
    roots.add('E:\\工作')
    return [...roots]
  }, [folders])

  const effectiveRoot = newRoot && rootOptions.includes(newRoot) ? newRoot : rootOptions[0] ?? 'D:\\工作'
  const sep = effectiveRoot.includes('\\') ? '\\' : '/'
  const fullPath = customMode ? customPath.trim() : `${effectiveRoot}${sep}${newName.trim().replace(/[\\/:*?"<>|]/g, '')}`

  const submitNewFolder = () => {
    if (!newName.trim() || !fullPath) return
    onAddFolder(newName.trim(), fullPath)
    setNewName('')
    setNewRoot('')
    setCustomMode(false)
    setCustomPath('')
    setCreating(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16, transformOrigin: 'bottom right' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="absolute bottom-[100px] right-0 flex max-h-[440px] w-[360px] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-2xl shadow-black/20 backdrop-blur-2xl"
          role="dialog"
          aria-label="工作台"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div>
              <div className="text-[15px] font-bold text-neutral-900">我的工作台</div>
              <div className="text-xs text-neutral-500">{folders.filter((f) => f.id !== 'inbox').length} 个工作文件夹</div>
            </div>
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setThemeOpen((o) => !o)}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="切换主题皮肤"
                title="切换主题皮肤"
              >
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a8 8 0 1 0 0 16c1.1 0 1.8-.9 1.8-1.9 0-.9-.7-1.5-.7-2.4 0-1 .8-1.7 1.9-1.7h1.5A3.5 3.5 0 0 0 18 6.5C17.5 4 14 2 10 2Z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6.5" cy="8" r="1.2" fill="currentColor" />
                  <circle cx="10" cy="6" r="1.2" fill="currentColor" />
                  <circle cx="13.5" cy="8" r="1.2" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="关闭面板"
              >
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
              <AnimatePresence>
                {themeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setThemeOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
                    >
                      <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium text-neutral-400">口袋皮肤</div>
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            onThemeChange(t.id)
                            setThemeOpen(false)
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-neutral-100 ${
                            t.id === theme.id ? 'bg-neutral-100/80' : ''
                          }`}
                        >
                          <PocketFace mood="idle" size={26} theme={t} />
                          <span className="flex-1 text-[13px] font-medium text-neutral-700">{t.name}</span>
                          {t.id === theme.id && (
                            <svg width="13" height="13" viewBox="0 0 14 14"><path d="M2.5 7.5 5.5 10.5 11.5 3.5" stroke={t.chipText} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 标签页 */}
          <div className="flex gap-1 px-5 pt-3">
            {(['folders', 'rules'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                style={{ color: tab === t ? theme.chipText : '#737373' }}
              >
                {tab === t && (
                  <motion.span layoutId="tabPill" className="absolute inset-0 rounded-full" style={{ background: theme.chipBg }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
                )}
                <span className="relative">{t === 'folders' ? '文件夹' : '归档规则'}</span>
              </button>
            ))}
          </div>

          {/* 内容 */}
          <div className="mt-2 flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: 'thin' }}>
            {tab === 'folders' ? (
              <>
                {folders.map((folder) => (
                  <div key={folder.id} className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/70">
                    {folderSvg(folder.color)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-neutral-800">{folder.name}</span>
                      <span className="block truncate text-[11px] text-neutral-400">{folder.path}</span>
                    </span>
                    <button
                      onClick={() => onOpenFolder(folder.path)}
                      className="shrink-0 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                    >
                      打开
                    </button>
                  </div>
                ))}
                <div className="px-1 pt-1">
                  {creating ? (
                    <div className="space-y-2 rounded-2xl bg-white/70 p-3">
                      <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitNewFolder()}
                        placeholder="文件夹名称，如：城北水厂项目"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-indigo-300 focus:outline-none"
                      />
                      {customMode ? (
                        <input
                          autoFocus
                          value={customPath}
                          onChange={(e) => setCustomPath(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitNewFolder()}
                          placeholder="输入完整路径"
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-indigo-300 focus:outline-none"
                        />
                      ) : (
                        <select
                          value={effectiveRoot}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setCustomMode(true)
                              setCustomPath(effectiveRoot + sep)
                            } else setNewRoot(e.target.value)
                          }}
                          className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-800 focus:border-indigo-300 focus:outline-none"
                          aria-label="选择存放位置"
                        >
                          {rootOptions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                          <option value="__custom__">自定义路径…</option>
                        </select>
                      )}
                      {newName.trim() && fullPath && (
                        <div className="truncate rounded-lg bg-neutral-100/80 px-2.5 py-1.5 text-[11px] text-neutral-500">
                          将创建于 <span className="font-medium text-neutral-700">{fullPath}</span>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        {customMode && (
                          <button onClick={() => setCustomMode(false)} className="rounded-full px-3.5 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100">返回下拉</button>
                        )}
                        <button onClick={() => setCreating(false)} className="rounded-full px-3.5 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100">取消</button>
                        <button
                          onClick={submitNewFolder}
                          disabled={!newName.trim() || !fullPath}
                          className="rounded-full px-3.5 py-1.5 text-xs font-medium text-white transition-transform enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-40"
                          style={{ background: theme.chipText }}
                        >
                          创建
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-neutral-300 py-2.5 text-[13px] font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                      新建工作文件夹
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-1 px-2 pt-1">
                <div className="pb-1 text-xs leading-relaxed text-neutral-500">口袋根据文件名中的关键词决定去向；路径点击可改：</div>
                {folders
                  .filter((f) => f.id !== 'inbox')
                  .map((folder) => (
                    <div key={folder.id} className="rounded-2xl bg-white/60 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: folder.color }} />
                        <span className="shrink-0 text-[13px] font-semibold text-neutral-800">{folder.name}</span>
                        <PathInput value={folder.path} onCommit={(p) => onUpdatePath(folder.id, p)} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {folder.keywords.map((kw) => (
                          <span key={kw} className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium" style={{ background: theme.chipBg, color: theme.chipText }}>
                            {kw}
                            <button onClick={() => onRemoveKeyword(folder.id, kw)} className="rounded-full p-0.5 opacity-50 hover:opacity-100" aria-label={`删除关键词 ${kw}`}>
                              <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </button>
                          </span>
                        ))}
                        <input
                          value={kwDraft[folder.id] ?? ''}
                          onChange={(e) => setKwDraft((d) => ({ ...d, [folder.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = (kwDraft[folder.id] ?? '').trim()
                              if (v) {
                                onAddKeyword(folder.id, v)
                                setKwDraft((d) => ({ ...d, [folder.id]: '' }))
                              }
                            }
                          }}
                          placeholder="+ 关键词，回车添加"
                          className="w-32 rounded-full border border-dashed border-neutral-300 bg-transparent px-2.5 py-1 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PathInput({ value, onCommit }: { value: string; onCommit: (p: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const commit = () => {
    setEditing(false)
    const v = draft.trim()
    if (v && v !== value) onCommit(v)
  }
  if (!editing)
    return (
      <button
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="min-w-0 truncate rounded px-1 text-left text-[11px] text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        title="点击修改路径"
      >
        {value}
      </button>
    )
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setEditing(false)
      }}
      className="min-w-0 flex-1 rounded border border-indigo-200 bg-white px-1 py-0.5 text-[11px] text-neutral-700 focus:outline-none"
    />
  )
}
