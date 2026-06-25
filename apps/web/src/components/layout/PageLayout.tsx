import React from 'react'
import { AppLayout } from '../../layouts/AppLayout'
import { AppHeader } from './AppHeader'

interface PageLayoutProps {
  children: React.ReactNode
  /** @deprecated Prefira title + rightContent — mantido para compatibilidade */
  header?: React.ReactNode
  title?: string
  subtitle?: string
  showBack?: boolean
  backPath?: string
  rightContent?: React.ReactNode
  noPadding?: boolean
  noBottomNav?: boolean
}

/**
 * Wrapper responsivo.
 * Mobile/tablet: AppHeader compacto no topo.
 * Desktop (≥1024px): Header lateral com título e ações (ex.: botão Novo).
 */
export function PageLayout({
  children,
  header,
  title,
  subtitle,
  showBack,
  backPath,
  rightContent,
  noPadding = false,
  noBottomNav = false,
}: PageLayoutProps) {
  const mobileHeader =
    header ??
    (title ? (
      <AppHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        backPath={backPath}
        rightContent={rightContent}
      />
    ) : undefined)

  return (
    <AppLayout
      mobileHeader={mobileHeader}
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      backPath={backPath}
      rightContent={rightContent}
      noPadding={noPadding}
      noBottomNav={noBottomNav}
    >
      {children}
    </AppLayout>
  )
}
