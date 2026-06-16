import React from 'react'
import { AppLayout } from '../../layouts/AppLayout'

interface PageLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  title?: string
  subtitle?: string
  noPadding?: boolean
  noBottomNav?: boolean
}

/**
 * Wrapper de compatibilidade — delega ao AppLayout responsivo.
 * `header` é exibido apenas no mobile (hero compacto).
 * No desktop, use `title` e `subtitle` para o Header superior.
 */
export function PageLayout({
  children,
  header,
  title,
  subtitle,
  noPadding = false,
  noBottomNav = false,
}: PageLayoutProps) {
  return (
    <AppLayout
      mobileHeader={header}
      title={title}
      subtitle={subtitle}
      noPadding={noPadding}
      noBottomNav={noBottomNav}
    >
      {children}
    </AppLayout>
  )
}
