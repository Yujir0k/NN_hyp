import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type OverlayProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  kind?: 'drawer' | 'modal' | 'fullscreen' | 'source'
  footer?: ReactNode
}

export function Overlay({ open, onClose, title, children, kind = 'drawer', footer }: OverlayProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])
  if (!open) return null
  return <div className={`overlay overlay--${kind}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="overlay__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="overlay__header"><h2 id={titleId}>{title}</h2><button ref={closeRef} className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header>
      <div className="overlay__body">{children}</div>
      {footer ? <footer className="overlay__footer">{footer}</footer> : null}
    </section>
  </div>
}
