import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

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
    const arquivo = req.file ? `/uploads/${req.file.filename}` : undefined

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
