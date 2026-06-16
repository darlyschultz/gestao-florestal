const BASE = process.env.API_URL || 'https://gestao-florestal-api.vercel.app'

async function time(label, fn) {
  const t0 = performance.now()
  const res = await fn()
  const ms = Math.round(performance.now() - t0)
  return { label, ms, res }
}

async function main() {
  const login = await time('login', () =>
    fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operacao@florestal.com', senha: '123456' }),
    }).then((r) => r.json())
  )
  const token = login.res.token
  const auth = { Authorization: `Bearer ${token}` }

  const paths = [
    '/api/health',
    '/api/fila',
    '/api/fila/resumo',
    '/api/portaria/agendamentos?periodo=hoje&status=pendente_checkin',
    '/api/viagens',
    '/api/cadastros/bundle/agendamento',
  ]

  console.log(`\nBenchmark: ${BASE}\n`)
  for (const path of paths) {
    const runs = []
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      const r = await fetch(`${BASE}${path}`, { headers: path === '/api/health' ? {} : auth })
      const body = await r.text()
      runs.push({ ms: Math.round(performance.now() - t0), status: r.status, size: body.length, cache: r.headers.get('x-cache') })
    }
    const avg = Math.round(runs.reduce((a, b) => a + b.ms, 0) / runs.length)
    const last = runs[runs.length - 1]
    console.log(`${path}`)
    console.log(`  avg=${avg}ms  last=${last.ms}ms  status=${last.status}  size=${last.size}b  x-cache=${last.cache ?? '-'}`)
  }
}

main().catch(console.error)
