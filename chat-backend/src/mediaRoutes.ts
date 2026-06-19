import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// === إعداد مجلد الرفع ===
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// === إعداد Multer ===
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/', 'audio/', 'video/', 'application/pdf', 'text/'];
    if (allowed.some(t => file.mimetype.startsWith(t))) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح به'));
    }
  }
});

// POST /api/media/upload — رفع مرفق جديد
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي ملف' }) as any;
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId مطلوب' }) as any;

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: '/uploads/' + req.file.filename,
        sessionId: parseInt(sessionId)
      }
    });
    res.status(201).json(attachment);
  } catch (err: any) {
    console.error('[Media Upload Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/session/:sessionId — استرجاع مرفقات جلسة محددة
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { sessionId: parseInt(String(req.params.sessionId)) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attachments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/media/:id — استرجاع ملف واحد بالمعرف
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const att = await prisma.attachment.findUnique({ where: { id: parseInt(String(req.params.id)) } });
    if (!att) return res.status(404).json({ error: 'المرفق غير موجود' }) as any;
    const filePath = path.join(UPLOADS_DIR, path.basename(att.url));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'الملف غير موجود على الخادم' }) as any;
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
