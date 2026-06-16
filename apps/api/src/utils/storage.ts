import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { put } from '@vercel/blob'

const isVercel = Boolean(process.env.VERCEL)

export const uploadMiddleware = multer({
  storage: isVercel ? multer.memoryStorage() : multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(__dirname, '../../uploads'))
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, `${uniqueSuffix}-${file.originalname}`)
    },
  }),
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

export const avatarUploadMiddleware = multer({
  storage: isVercel ? multer.memoryStorage() : multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(__dirname, '../../uploads/avatars')
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
})

export async function saveUploadedFile(
  file: Express.Multer.File,
  folder: 'avatars' | 'documentos'
): Promise<string> {
  if (isVercel) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN não configurado na Vercel')
    }
    const blob = await put(`${folder}/${Date.now()}-${file.originalname}`, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return blob.url
  }

  if (folder === 'avatars') {
    return `/uploads/avatars/${file.filename}`
  }

  return `/uploads/${file.filename}`
}
