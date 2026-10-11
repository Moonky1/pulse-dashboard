import { useLayoutEffect, useRef } from 'react'

export function TopScrollTable({ children, label }) {
  const top = useRef(null), body = useRef(null), spacer = useRef(null)
  useLayoutEffect(() => {
    const viewport = body.current, rail = top.current
    const resize = () => {
      spacer.current.style.width = `${viewport.scrollWidth}px`
      rail.hidden = viewport.scrollWidth <= viewport.clientWidth
      rail.scrollLeft = viewport.scrollLeft
    }
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild)
    resize()
    return () => observer.disconnect()
  }, [children])
  function sync(from, to) {
    if (to.current && Math.abs(to.current.scrollLeft - from.scrollLeft) > 1) to.current.scrollLeft = from.scrollLeft
  }
  return <div className="dash-top-table"><div ref={top} className="dash-table-top-scroll" tabIndex={0} role="region" aria-label="Scroll table horizontally" onScroll={e => sync(e.currentTarget, body)}><div ref={spacer} /></div><div ref={body} className="dash-table-scroll" tabIndex={0} aria-label={label} onScroll={e => sync(e.currentTarget, top)}>{children}</div></div>
}
