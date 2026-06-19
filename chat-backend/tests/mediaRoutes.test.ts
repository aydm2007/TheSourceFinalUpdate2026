import request from 'supertest';
import app from '../src/server'; // assuming export of express app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Media Routes', () => {
  let sessionId: number;
  const testFilePath = __dirname + '/test.png'; // placeholder PNG file path

  beforeAll(async () => {
    // create a test session
    const session = await prisma.session.create({
      data: { title: 'Test Session', messages: '[]' },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    // clean up
    await prisma.attachment.deleteMany({ where: { sessionId } });
    await prisma.session.delete({ where: { id: sessionId } });
    await prisma.$disconnect();
  });

  it('should upload a file', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .field('sessionId', sessionId)
      .attach('file', testFilePath);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should list attachments for a session', async () => {
    const res = await request(app).get(`/api/media/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
