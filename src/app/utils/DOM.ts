export interface Bounds {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

export const getBounds = (element: Element): Bounds => {
  const bounds = element.getBoundingClientRect()
  const scroll = window.scrollY ?? 0

  return {
    bottom: bounds.bottom + scroll,
    height: bounds.height,
    left: bounds.left,
    right: bounds.right,
    top: bounds.top + scroll,
    width: bounds.width,
  }
}

export const DOMUtils = {
  getBounds,
}
