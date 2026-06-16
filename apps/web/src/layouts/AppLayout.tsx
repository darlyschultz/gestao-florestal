import React from 'react'
import { Sidebar } from '../components/navigation/Sidebar'
import { BottomNavigation } from '../components/navigation/BottomNavigation'
import { Header } from '../components/navigation/Header'
import { useResponsiveLayout } from '../hooks/useResponsiveLayout'

function DevDeviceIndicator() {
  const { deviceType } = useResponsiveLayout()

  if (!import.meta.env.DEV) return null

  const colors = {
    mobile: 'bg-blue-600',
    tablet: 'bg-amber-600',
    desktop: 'bg-green-600',
  }

  return (
    <div
      className={`fixed bottom-20 lg:bottom-4 right-4 z-[9999] px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg capitalize ${colors[deviceType]}`}
    >
      {deviceType}
    </div>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
  /** Header customizado (ex.: hero verde do menu no mobile) */
  mobileHeader?: React.ReactNode
  /** Header desktop — título da página */
  title?: string
  subtitle?: string
  noPadding?: boolean
  noBottomNav?: boolean
}

export function AppLayout({
  children,
  mobileHeader,
  title,
  subtitle,
  noPadding = false,
  noBottomNav = false,
}: AppLayoutProps) {
  const { isMobile, isDesktop } = useResponsiveLayout()

  const mainPadding = noPadding
    ? ''
    : 'px-4 md:px-6 lg:px-8 xl:px-12 py-4 lg:py-6'

  const bottomPad = !noBottomNav && !isDesktop ? 'pb-24' : 'pb-6'

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        {isDesktop && <Header title={title} subtitle={subtitle} />}
        {isMobile && mobileHeader}

        <main className={`flex-1 w-full ${mainPadding} ${bottomPad}`}>
          {children}
        </main>

        {!noBottomNav && isMobile && <BottomNavigation />}
      </div>

      <DevDeviceIndicator />
    </div>
  )
}
