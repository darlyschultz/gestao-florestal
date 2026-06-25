import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { findUserByLogin } from '../utils/motoristaUser'

const router = Router()

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe e-mail ou CPF e a senha' })
    }

    const user = await findUserByLogin(String(email))

    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const senhaValida = await bcrypt.compare(senha, user.senha)

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = jwt.sign(
      { id: user.id, perfil: user.perfil, nome: user.nome, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    )

    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        transportadoraId: user.transportadoraId,
        fazendaId: user.fazendaId,
        avatar: user.avatar,
        telefone: user.telefone,
        cargo: user.cargo,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        transportadoraId: true,
        fazendaId: true,
        avatar: true,
        telefone: true,
        cargo: true,
        fazenda: { select: { id: true, nome: true } },
      },
    })

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    return res.json(user)
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
