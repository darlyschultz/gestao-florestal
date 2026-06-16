/**
 * Captura telas do app para o manual de uso.
 * Uso: node scripts/capture-manual-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../docs/manual/screenshots')
const BASE = process.env.APP_URL || 'https://gestao-florestal-api.vercel.app'
const SENHA = '123456'

const profiles = [
  { id: 'admin', email: 'admin@florestal.com' },
  { id: 'portaria', email: 'portaria@florestal.com' },
  { id: 'operacao', email: 'operacao@florestal.com' },
  { id: 'transportador', email: 'transportador@florestal.com' },
]

async function captureWithProfile(browser, profile, fn) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', profile.email)
  await page.fill('input[type="password"]', SENHA)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/menu', { timeout: 15000 })
  await page.waitForTimeout(800)
  await fn(page)
  await context.close()
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', SENHA)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/menu', { timeout: 15000 })
  await page.waitForTimeout(800)
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('  ✓', name)
}

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
  })
  const page = await context.newPage()

  console.log(`Capturando em ${BASE} → ${OUT}\n`)

  // Login (sem autenticar)
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await shot(page, '01-login')

  // Admin — menu e módulos principais
  await login(page, profiles[0].email)
  await shot(page, '02-menu-admin')

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, '03-dashboard')

  await page.goto(`${BASE}/agendamento/calendario`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, '04-agendamento-calendario')

  await page.goto(`${BASE}/agendamento/novo`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, '05-agendamento-novo')

  await page.goto(`${BASE}/viagens`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, '06-viagens-lista')

  // Detalhe da primeira viagem, se existir
  const viagemLink = page.locator('[class*="group"]').first()
  if (await viagemLink.count()) {
    await viagemLink.click()
    await page.waitForTimeout(1200)
    await shot(page, '07-viagem-detalhe')
  }

  await page.goto(`${BASE}/cadastros`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '08-cadastros')

  await page.goto(`${BASE}/configuracoes`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '09-configuracoes')

  await page.goto(`${BASE}/relatorios`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '10-relatorios')

  // Portaria
  await captureWithProfile(browser, profiles[1], async (page) => {
    await page.goto(`${BASE}/portaria`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await shot(page, '11-portaria-agendamentos')

    const tabCheckin = page.getByRole('button', { name: /check-in/i })
    if (await tabCheckin.count()) {
      await tabCheckin.click()
      await page.waitForTimeout(600)
      await shot(page, '12-portaria-checkin')
    }
  })

  // Fila / Pátio
  await captureWithProfile(browser, profiles[2], async (page) => {
    await page.goto(`${BASE}/fila-patio`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await shot(page, '13-fila-patio')

    const expandBtn = page.locator('button.w-full.text-left').first()
    if (await expandBtn.count()) {
      await expandBtn.click()
      await page.waitForTimeout(800)
      await shot(page, '14-fila-patio-expandido')
    }
  })

  // Transportador — menu reduzido
  await captureWithProfile(browser, profiles[3], async (page) => {
    await shot(page, '15-menu-transportador')
  })

  await browser.close()
  console.log('\nConcluído.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
