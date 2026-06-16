import { createApp } from './app'

const app = createApp()
const PORT = process.env.PORT || 5291

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌿 API Rastreamento Florestal rodando na porta ${PORT}`)
    console.log(`   http://localhost:${PORT}/api/health`)
  })
}

export default app
