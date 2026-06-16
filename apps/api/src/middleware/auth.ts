import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; perfil: string; nome: string; email: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token não informado' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string; perfil: string; nome: string; email: string
    }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function requirePerfil(...perfis: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' })
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' })
    }
    next()
  }
}
