/**
 * Gera PDF do manual a partir do Markdown + screenshots.
 * Uso: node scripts/generate-manual-pdf.mjs
 */
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DOCS_DIR = path.join(ROOT, 'docs')
const MD_PATH = path.join(DOCS_DIR, 'MANUAL_DE_USO.md')
const OUT_DIR = path.join(DOCS_DIR, 'manual')
const OUT_PDF = path.join(OUT_DIR, 'MANUAL_DE_USO.pdf')

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }

/** Converte caminhos do markdown (relativos a docs/) em data URLs base64. */
async function embedImagesAsBase64(md) {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  let out = md
  for (const [, alt, relPath] of md.matchAll(re)) {
    if (relPath.startsWith('data:')) continue

    const absPath = path.isAbsolute(relPath) ? relPath : path.join(DOCS_DIR, relPath)
    await access(absPath)

    const buf = await readFile(absPath)
    const ext = path.extname(absPath).slice(1).toLowerCase()
    const mime = MIME[ext] || 'image/png'
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`

    out = out.replace(`![${alt}](${relPath})`, `![${alt}](${dataUrl})`)
  }
  return out
}

function mdToHtml(md) {
  let html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" /><figcaption>$1</figcaption></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Tabelas simples
  html = html.replace(
    /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g,
    (block) => {
      const rows = block.trim().split('\n').filter((r) => !r.match(/^\|[-| :]+\|$/))
      const body = rows
        .map((row, i) => {
          const cells = row.split('|').filter(Boolean).map((c) => c.trim())
          const tag = i === 0 ? 'th' : 'td'
          return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`
        })
        .join('')
      return `<table>${body}</table>`
    },
  )

  // Listas
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)

  // Numeração
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Parágrafos soltos
  html = html
    .split('\n\n')
    .map((chunk) => {
      const t = chunk.trim()
      if (!t) return ''
      if (/^<(h[1-6]|ul|ol|table|pre|figure|blockquote|hr|li)/.test(t)) return t
      return `<p>${t.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

  return html
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const mdRaw = await readFile(MD_PATH, 'utf-8')
  const md = await embedImagesAsBase64(mdRaw)
  const body = mdToHtml(md)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Manual de Uso — Gestão Florestal</title>
  <style>
    @page { margin: 18mm 16mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1f2937;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 22pt; color: #14532d; border-bottom: 3px solid #16a34a; padding-bottom: 8px; margin-top: 0; page-break-after: avoid; }
    h2 { font-size: 15pt; color: #166534; margin-top: 28px; page-break-after: avoid; border-left: 4px solid #22c55e; padding-left: 10px; }
    h3 { font-size: 12pt; color: #374151; margin-top: 18px; page-break-after: avoid; }
    h4 { font-size: 11pt; color: #4b5563; }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0 8px 20px; padding: 0; }
    li { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; page-break-inside: avoid; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    th { background: #f0fdf4; color: #14532d; font-weight: 600; }
    tr:nth-child(even) td { background: #f9fafb; }
    figure { margin: 16px 0; page-break-inside: avoid; text-align: center; }
    figure img { max-width: 280px; width: 100%; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    figcaption { font-size: 9pt; color: #6b7280; margin-top: 6px; font-style: italic; }
    blockquote { background: #f0fdf4; border-left: 4px solid #22c55e; margin: 12px 0; padding: 8px 12px; color: #374151; font-size: 10pt; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 9.5pt; }
    pre { background: #1f2937; color: #f9fafb; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 9pt; page-break-inside: avoid; }
    pre code { background: none; color: inherit; padding: 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    a { color: #15803d; }
    strong { color: #111827; }
    .cover {
      text-align: center;
      padding: 60px 20px 40px;
      page-break-after: always;
    }
    .cover h1 { border: none; font-size: 26pt; }
    .cover p { color: #6b7280; font-size: 12pt; }
    .cover .logo { font-size: 48pt; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="cover">
    <div class="logo">🌲</div>
    <h1>Sistema de Rastreamento Florestal</h1>
    <p><strong>Manual de Uso</strong> · Versão 1.0.0</p>
    <p>gestao-florestal-api.vercel.app</p>
    <p>Junho/2026</p>
  </div>
  ${body}
</body>
</html>`

  const htmlPath = path.join(OUT_DIR, 'MANUAL_DE_USO.html')
  await writeFile(htmlPath, html, 'utf-8')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'))
    await Promise.all(
      imgs.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = () => reject(new Error(`Falha ao carregar: ${img.alt}`))
              }),
      ),
    )
  })
  await page.pdf({
    path: OUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  })
  await browser.close()

  console.log('PDF gerado:', OUT_PDF)
  console.log('HTML auxiliar:', htmlPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
