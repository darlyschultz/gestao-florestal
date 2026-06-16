/** Base URL da API: mesma origem na Vercel, localhost em dev. */
export function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    return ''
  }
  return 'http://localhost:5291'
}

/** Resolve URL de arquivo (upload local ou Vercel Blob). */
export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${getApiBase()}${path}`
}
