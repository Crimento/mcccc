import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'

const defaultSelector = '[data-setting], [data-tracked-setting], [data-occult-species]'
type Bounds = { top: number; bottom: number; left: number; right: number }
type Candidate = { element: HTMLElement; bounds: Bounds; order: number }

/** Track presentation context without changing navigation or editor state. */
export function useVisibleSetting(
  container: Ref<HTMLElement | undefined>,
  selector = defaultSelector,
) {
  const element = shallowRef<HTMLElement>()
  let mounted = false
  let frame: number | undefined
  let interaction: HTMLElement | undefined
  let observedContainer: HTMLElement | undefined
  let resizeObserver: ResizeObserver | undefined
  let mutationObserver: MutationObserver | undefined
  let candidates: HTMLElement[] = []
  let candidatesDirty = true

  function boundsFor(node: HTMLElement): Bounds | undefined {
    const style = window.getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return

    const rect = node.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return rect
    if (style.display !== 'contents') return

    // Desktop lifespan/template profiles use display:contents. Their own
    // rectangle is empty, but their visible grid cells still identify a profile.
    let result: Bounds | undefined
    for (const child of node.children) {
      if (!(child instanceof HTMLElement)) continue
      const bounds = boundsFor(child)
      if (!bounds) continue
      result = result ? {
        top: Math.min(result.top, bounds.top),
        bottom: Math.max(result.bottom, bounds.bottom),
        left: Math.min(result.left, bounds.left),
        right: Math.max(result.right, bounds.right),
      } : bounds
    }
    return result
  }

  function visibleBounds(node: HTMLElement, headerBottom: number): Bounds | undefined {
    if (!node.isConnected || !observedContainer?.contains(node)) return
    const bounds = boundsFor(node)
    if (!bounds || bounds.bottom <= headerBottom || bounds.top >= window.innerHeight
      || bounds.right <= 0 || bounds.left >= window.innerWidth) return
    return bounds
  }

  function headerBottom() {
    const header = document.querySelector<HTMLElement>('[data-editor-header]')
    return header ? Math.max(0, header.getBoundingClientRect().bottom) : 72
  }

  function scan() {
    frame = undefined
    const root = observedContainer
    if (!root?.isConnected) {
      element.value = undefined
      interaction = undefined
      return
    }

    const header = headerBottom()
    if (interaction && visibleBounds(interaction, header)) {
      element.value = interaction
      return
    }
    interaction = undefined

    const line = header + 24
    const rootBounds = boundsFor(root)
    if (!rootBounds || rootBounds.top > line || rootBounds.bottom <= header) {
      element.value = undefined
      return
    }

    if (candidatesDirty) {
      candidates = [...root.querySelectorAll<HTMLElement>(selector)]
      candidatesDirty = false
    }
    const visible: Candidate[] = []
    candidates.forEach((node, order) => {
      const bounds = visibleBounds(node, header)
      if (bounds) visible.push({ element: node, bounds, order })
    })

    // Prefer species cards and expanded profiles over their enclosing setting
    // or collapsed-group fallback. Only visible descendants take precedence.
    const leaves = new Set(visible.map(candidate => candidate.element))
    for (const candidate of visible) {
      let parent = candidate.element.parentElement?.closest<HTMLElement>(selector)
      while (parent && root.contains(parent)) {
        leaves.delete(parent)
        parent = parent.parentElement?.closest<HTMLElement>(selector)
      }
    }
    const distance = ({ bounds }: Candidate) =>
      bounds.top > line ? bounds.top - line : bounds.bottom < line ? line - bounds.bottom : 0
    const nearest = visible.filter(candidate => leaves.has(candidate.element)).sort((a, b) =>
      distance(a) - distance(b) || a.bounds.top - b.bounds.top || a.order - b.order,
    )[0]
    element.value = nearest?.element
  }

  function refresh() {
    if (!mounted || frame !== undefined) return
    frame = window.requestAnimationFrame(scan)
  }

  function clear() {
    interaction = undefined
    element.value = undefined
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    frame = undefined
  }

  function onScroll() {
    interaction = undefined
    refresh()
  }

  function onInteraction(event: Event) {
    if (!(event.target instanceof Element)) return
    const candidate = event.target.closest<HTMLElement>(selector)
    if (!candidate || !visibleBounds(candidate, headerBottom())) return
    // Explicit interaction identifies a column or species even before the
    // settings list reaches the tracking line. Keep it until the next scroll.
    interaction = candidate
    element.value = candidate
  }

  function disconnectContainer() {
    observedContainer?.removeEventListener('focusin', onInteraction)
    observedContainer?.removeEventListener('pointerover', onInteraction)
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    observedContainer = undefined
    candidates = []
    candidatesDirty = true
  }

  function connectContainer() {
    disconnectContainer()
    clear()
    observedContainer = container.value
    const root = observedContainer
    if (!root) return
    root.addEventListener('focusin', onInteraction)
    root.addEventListener('pointerover', onInteraction, { passive: true })
    resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(root)
    const header = document.querySelector('[data-editor-header]')
    if (header) resizeObserver.observe(header)
    mutationObserver = new MutationObserver(() => {
      candidatesDirty = true
      refresh()
    })
    mutationObserver.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-setting', 'data-tracked-setting', 'data-occult-species'],
    })
    refresh()
  }

  watch(container, () => { if (mounted) connectContainer() }, { flush: 'post' })
  onMounted(() => {
    mounted = true
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', refresh, { passive: true })
    connectContainer()
  })
  onBeforeUnmount(() => {
    mounted = false
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', refresh)
    disconnectContainer()
    clear()
  })

  return { element, refresh, clear }
}
