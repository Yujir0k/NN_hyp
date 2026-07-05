import type { ReactNode, SVGProps } from 'react'

export function NorlabMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 40 40" aria-hidden="true" {...props}><path d="M20 3 34 11v18L20 37 6 29V11L20 3Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="m12 15 8-5 8 5v10l-8 5-8-5V15Z" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M13 32h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
}

export function ScoreDots({ value, label, icon }: { value: number; label: string; icon?: ReactNode }) {
  return <div className="score-dots" aria-label={`${label}: ${value} из 5`}>
    <span>{icon ? <em aria-hidden="true">{icon}</em> : null}{label}</span>
    <div>{[1,2,3,4,5].map((n) => <i key={n} className={n <= value ? 'is-on' : ''} />)}</div>
  </div>
}
