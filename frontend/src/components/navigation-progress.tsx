/*
Copyright (C) 2023-2026 QuantumNous
*/
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

/**
 * Top navigation progress bar (new-api style).
 * Triggers on every pathname/search change under React Router.
 */
export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const location = useLocation()
  const first = useRef(true)

  useEffect(() => {
    // skip initial mount flash
    if (first.current) {
      first.current = false
      return
    }
    ref.current?.continuousStart()
    const t = window.setTimeout(() => {
      ref.current?.complete()
    }, 280)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.search])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow={true}
      height={2}
    />
  )
}
