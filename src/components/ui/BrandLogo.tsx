'use client'

import React from 'react'

interface BrandLogoProps {
  width?: number
}

export function BrandLogo({ width = 180 }: BrandLogoProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Quentadoz%20Main%20Brand.png"
        alt="Quentadoz"
        width={width}
        className="theme-light-only"
        style={{ height: 'auto' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Quentadoz%20Dark%20Brand.png"
        alt="Quentadoz"
        width={width}
        className="theme-dark-only"
        style={{ height: 'auto' }}
      />
    </>
  )
}
