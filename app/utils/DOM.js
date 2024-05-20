export const getBounds = (element) => {
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
