import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react'

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>
}

export function ArrowButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return <button className="arrow-button" onClick={onClick} aria-label={label}><ArrowRight /></button>
}

export function Status({ tone = 'info', children }: { tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted'; children: ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' || tone === 'danger' ? AlertTriangle : CircleDashed
  return <span className={`status status--${tone}`}><Icon />{children}</span>
}

export function MetricStrip({ items }: { items: { label: string; value: ReactNode; hint?: string }[] }) {
  return <div className="metric-strip">{items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.hint ? <small>{item.hint}</small> : null}</div>)}</div>
}

export function SectionHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return <div className="section-header"><div><h2>{title}</h2>{text ? <p>{text}</p> : null}</div>{actions ? <div className="section-header__actions">{actions}</div> : null}</div>
}
