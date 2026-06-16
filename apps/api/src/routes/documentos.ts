import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { uploadMiddleware, saveUploadedFile } from '../utils/storage'
import { prisma } from '../lib/prisma'

const router = Router()

const upload = uploadMiddleware

router.use(authMiddleware)

router.get('/viagens/:viagemId', async (req: AuthRequest, res: Response) => {
  try {
    const documentos = await prisma.documentoViagem.findMany({
      where: { viagemId: req.params.viagemId },
    })
    return res.json(documentos)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar documentos' })
  }
})

router.post('/viagens/:viagemId', upload.single('arquivo'), async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, numero } = req.body
    const arquivo = req.file ? await saveUploadedFile(req.file, 'documentos') : undefined

    const documento = await prisma.documentoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo,
        numero,
        arquivo,
        status: 'pendente',
      },
    })

    return res.status(201).json(documento)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao salvar documento' })
  }
})

router.put('/:id/validar', async (req: AuthRequest, res: Response) => {
  try {
    const { status, observacao } = req.body

    const documento = await prisma.documentoViagem.update({
      where: { id: req.params.id },
      data: { status, observacao },
    })

    return res.json(documento)
  } catch {
    return res.status(500).json({ error: 'Erro ao validar documento' })
  }
})

export default router
