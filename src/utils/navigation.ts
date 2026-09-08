export function navigate(to: string) {
  window.dispatchEvent(new CustomEvent('ts:navigate', { detail: { to } }))
}
