import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { logAudit } from '../utils/audit'

const router = Router()
const prisma = new PrismaClient()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

const userSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  cargo: true,
  perfil: true,
  avatar: true,
  temaPreferido: true,
  notificacoesEmail: true,
  notificacoesPush: true,
  notificacoesSistema: true,
  transportadoraId: true,
  unidadeId: true,
  roleId: true,
  ativo: true,
  createdAt: true,
  transportadora: { select: { id: true, nome: true } },
  unidade: { select: { id: true, nome: true } },
  role: { select: { id: true, name: true, slug: true } },
}

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: userSelect,
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar perfil' })
  }
})

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, email, telefone, cargo, temaPreferido, notificacoesEmail, notificacoesPush, notificacoesSistema } = req.body

    const anterior = await prisma.user.findUnique({ where: { id: req.user!.id }, select: userSelect })

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { nome, email, telefone, cargo, temaPreferido, notificacoesEmail, notificacoesPush, notificacoesSistema },
      select: userSelect,
    })

    await logAudit(req, { entityType: 'user', entityId: user.id, action: 'update_profile', oldValue: anterior, newValue: user })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar perfil' })
  }
})

router.put('/senha', async (req: AuthRequest, res: Response) => {
  try {
    const { senhaAtual, novaSenha, confirmarSenha } = req.body

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha' })
    }
    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ error: 'As senhas não conferem' })
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const valida = await bcrypt.compare(senhaAtual, user.senha)
    if (!valida) return res.status(400).json({ error: 'Senha atual incorreta' })

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { senha: await bcrypt.hash(novaSenha, 10) },
    })

    await logAudit(req, { entityType: 'user', entityId: user.id, action: 'change_password' })
    return res.json({ message: 'Senha alterada com sucesso' })
  } catch {
    return res.status(500).json({ error: 'Erro ao alterar senha' })
  }
})

router.post('/avatar', upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

    const avatar = `/uploads/avatars/${req.file.filename}`
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar },
      select: userSelect,
    })

    await logAudit(req, { entityType: 'user', entityId: user.id, action: 'update_avatar', newValue: { avatar } })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao enviar avatar' })
  }
})

export default router
