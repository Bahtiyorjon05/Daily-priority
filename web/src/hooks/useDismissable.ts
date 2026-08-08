import { useEffect, useRef } from 'react'

/**
 * Closes a popover when the pointer goes down outside it, or on Escape.
 *
 * Written because the header dropdowns each solved this differently, or not at
 * all. The phase picker relied on a backdrop marked `sm:hidden`, so on any
 * screen wider than `sm` nothing dismissed it — it stayed open while you clicked
 * around it. And the profile dropdown used `!target.closest('[data-dropdown]')`,
 * which treats *every* dropdown as "inside", so opening one never closed its
 * neighbour and you could end up with two menus open at once.
 *
 * Attach the returned ref to the element that wraps BOTH the trigger and the
 * panel. Wrapping only the panel means a click on the trigger reads as
 * "outside": the hook closes, the button's own handler toggles, and the popover
 * appears stuck open.
 *
 * `pointerdown` rather than `click` so it covers mouse, touch and pen in one
 * listener and fires before focus moves. Capture phase, so a child calling
 * `stopPropagation` cannot leave the popover stranded.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void
) {
  const ref = useRef<T | null>(null)
  // Keep the latest callback without re-subscribing on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current
      if (el && !el.contains(e.target as Node)) onCloseRef.current()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return ref
}
