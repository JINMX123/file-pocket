import type { FileKind } from '@/lib/model'

const KIND_STYLE: Record<FileKind, { bg: string; fg: string; label: string }> = {
  word: { bg: '#dbe4ff', fg: '#3b5bdb', label: 'W' },
  excel: { bg: '#d3f0e2', fg: '#1f7a4d', label: 'X' },
  ppt: { bg: '#ffe3cc', fg: '#c05e10', label: 'P' },
  cad: { bg: '#e8defb', fg: '#7048c8', label: 'C' },
  image: { bg: '#fbdce7', fg: '#c2255c', label: '图' },
  other: { bg: '#e9ecef', fg: '#495057', label: '?' },
}

export function FileTypeIcon({ kind, size = 32 }: { kind: FileKind; size?: number }) {
  const s = KIND_STYLE[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M7 3.5h11.5L25 10v15a3.5 3.5 0 0 1-3.5 3.5h-14A3.5 3.5 0 0 1 4 25V7a3.5 3.5 0 0 1 3.5-3.5Z"
        fill={s.bg}
      />
      <path d="M18.5 3.5 25 10h-5a1.5 1.5 0 0 1-1.5-1.5v-5Z" fill={s.fg} opacity=".35" />
      <text
        x="14.5"
        y="23"
        textAnchor="middle"
        fontSize={kind === 'image' ? 11 : 12}
        fontWeight="700"
        fill={s.fg}
        fontFamily="inherit"
      >
        {s.label}
      </text>
    </svg>
  )
}

export function folderSvg(color: string, size = 30) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M3.5 9a3 3 0 0 1 3-3h6l3 3.5h10a3 3 0 0 1 3 3V24a3 3 0 0 1-3 3h-19a3 3 0 0 1-3-3V9Z"
        fill={color}
        opacity=".9"
      />
      <path
        d="M3.5 13h25V24a3 3 0 0 1-3 3h-19a3 3 0 0 1-3-3V13Z"
        fill="#fff"
        opacity=".28"
      />
    </svg>
  )
}
