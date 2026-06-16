import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function useResponsiveLayout() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )
  const [deviceType, setDeviceType] = useState<DeviceType>(() =>
    getDeviceType(typeof window !== 'undefined' ? window.innerWidth : 1024)
  )

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      setWidth(w)
      setDeviceType(getDeviceType(w))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    width,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  }
}
