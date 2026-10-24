// 关键词识别逻辑 —— 与网页原型同源，直接复用

export type FileKind = 'word' | 'excel' | 'ppt' | 'cad' | 'image' | 'other'

export interface RuleFolder {
  id: string
  name: string
  path: string
  color: string
  keywords: string[]
}

export const DEFAULT_FOLDERS: RuleFolder[] = [
  {
    id: 'bridge',
    name: '滨江大桥项目',
    path: 'D:\\工作\\滨江大桥',
    color: '#7c93f5',
    keywords: ['滨江', '大桥', '桩基', '计算书', '索力'],
  },
  {
    id: 'road',
    name: '东环快速路项目',
    path: 'D:\\工作\\东环快速路',
    color: '#4fb286',
    keywords: ['快速路', '道路', '路基', '进度', '施工'],
  },
  {
    id: 'report',
    name: '汇报与会议纪要',
    path: 'D:\\工作\\汇报材料',
    color: '#e8934b',
    keywords: ['纪要', '会议', '汇报', '评审', '周报'],
  },
  {
    id: 'photo',
    name: '现场影像库',
    path: 'D:\\工作\\影像资料',
    color: '#d96b8f',
    keywords: ['照片', '现场', '影像', '航拍'],
  },
  {
    id: 'inbox',
    name: '待分类',
    path: 'D:\\工作\\待分类',
    color: '#8a8f98',
    keywords: [],
  },
]

export function kindOf(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['doc', 'docx', 'wps'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv', 'et'].includes(ext)) return 'excel'
  if (['ppt', 'pptx', 'dps'].includes(ext)) return 'ppt'
  if (['dwg', 'dxf'].includes(ext)) return 'cad'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
  return 'other'
}

export interface MatchResult {
  folder: RuleFolder
  keyword: string | null
}

/** 按规则顺序 + 关键词最长优先匹配文件名 */
export function classify(name: string, folders: RuleFolder[]): MatchResult {
  const lower = name.toLowerCase()
  let best: { folder: RuleFolder; keyword: string } | null = null
  for (const folder of folders) {
    if (folder.id === 'inbox') continue
    for (const kw of folder.keywords) {
      const k = kw.toLowerCase().trim()
      if (!k) continue
      if (lower.includes(k)) {
        if (!best || k.length > best.keyword.length) best = { folder, keyword: kw }
      }
    }
  }
  const inbox = folders.find((f) => f.id === 'inbox')!
  return best ? { folder: best.folder, keyword: best.keyword } : { folder: inbox, keyword: null }
}

export function versionOf(name: string): { tag: '受控版' | '过程稿'; version: string | null } {
  const controlled = /定版|最终|受控|报批|审定|归档/.test(name)
  const m = name.match(/[vV](\d+(?:\.\d+)?)/) ?? name.match(/第?([一二三四五六\d]+)版/)
  return { tag: controlled ? '受控版' : '过程稿', version: m ? `V${m[1]}` : null }
}

/** 从完整路径取文件名（兼容 Windows / Unix 分隔符） */
export function basename(p: string): string {
  const parts = p.split(/[\\/]/)
  return parts[parts.length - 1] || p
}

export interface PocketTheme {
  id: string
  name: string
  body: string
  bodyLight: string
  mouth: string
  blush: string
  chipBg: string
  chipText: string
}

export const THEMES: PocketTheme[] = [
  { id: 'berry', name: '蓝莓', body: '#7c93f5', bodyLight: '#97a9f8', mouth: '#3a4a9e', blush: '#ffb3c6', chipBg: '#e0e7ff', chipText: '#4f46e5' },
  { id: 'matcha', name: '抹茶', body: '#5cb98c', bodyLight: '#83d1ab', mouth: '#1f5c40', blush: '#ffd0a8', chipBg: '#d8f3e6', chipText: '#1f7a4d' },
  { id: 'peach', name: '蜜桃', body: '#ef8fa3', bodyLight: '#f7b1be', mouth: '#8e2f49', blush: '#ffe0b8', chipBg: '#fde3e9', chipText: '#c2255c' },
]

export const FOLDER_COLORS = ['#4fa8c9', '#b085f5', '#7c93f5', '#4fb286', '#e8934b', '#d96b8f']

/** 持久化配置的结构 */
export interface PocketConfig {
  folders: RuleFolder[]
  themeId: string
}
