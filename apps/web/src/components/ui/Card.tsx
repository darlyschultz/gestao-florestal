import React, { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  bordered?: boolean
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  bordered = false,
  ...props
}: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  const base = 'bg-white rounded-2xl shadow-card'
  const hoverClass = hover ? 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200' : ''
  const borderClass = bordered ? 'border border-gray-100' : ''

  return (
    <div className={`${base} ${paddings[padding]} ${hoverClass} ${borderClass} ${className}`} {...props}>
      {children}
    </div>
  )
}
