'use client'

export default function SearchPage() {
  // Retired: keep this route for backwards compatibility.
  // Redirect /search?q=... to /listings?search=...
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const q = (params.get('q') || '').trim()
    const target = q ? `/listings?search=${encodeURIComponent(q)}` : '/listings'
    window.location.replace(target)
  }
  return null
}

