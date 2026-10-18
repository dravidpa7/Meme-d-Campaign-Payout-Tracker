/**
 * HTTP-level checks that need no database: routing, auth guards, validation
 * and error shapes. (Payout flow against a real replica set is exercised
 * separately with mongodb-memory-server.)
 */
import request from 'supertest';
import { app } from '../../src/app';
import { signToken } from '../../src/utils/jwt';

const brandToken = signToken({ sub: '65f000000000000000000001', role: 'brand' });
const creatorToken = signToken({ sub: '65f000000000000000000011', role: 'creator' });

describe('HTTP smoke', () => {
  it('GET /api/health is public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });

  describe('validation', () => {
    it('rejects a bad signup body with field details', async () => {
      const res = await request(app).post('/api/auth/signup').send({ name: 'A', email: 'nope', password: '123', role: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(
        expect.arrayContaining(['name', 'email', 'password', 'role']),
      );
    });

    it('rejects an invalid submission id on PATCH /views', async () => {
      const res = await request(app).patch('/api/submissions/not-an-id/views').send({ views: 10 });
      expect(res.status).toBe(400);
    });

    it.each([-5, 1.5, '100'])('rejects invalid views value %p on PATCH /views', async (views) => {
      const res = await request(app).patch('/api/submissions/65f000000000000000005001/views').send({ views });
      expect(res.status).toBe(400);
    });

    it('rejects an invalid milestone ladder with a domain rule code', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          name: 'Bad ladder',
          platform: 'Instagram',
          totalBudget: 5000,
          milestones: [
            { views: 10_000, payout: 2_000 },
            { views: 50_000, payout: 500 },
          ],
        });
      expect(res.status).toBe(400);
      expect(res.body.error.details.rule).toBe('INVALID_MILESTONES');
    });
  });

  describe('auth guards', () => {
    it('requires a token for campaigns', async () => {
      expect((await request(app).get('/api/campaigns')).status).toBe(401);
    });

    it('rejects a garbage token', async () => {
      const res = await request(app).get('/api/campaigns').set('Authorization', 'Bearer garbage');
      expect(res.status).toBe(401);
    });

    it('forbids creators from creating campaigns', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('forbids brands from submitting posts and viewing earnings', async () => {
      const auth = { Authorization: `Bearer ${brandToken}` };
      expect((await request(app).post('/api/submissions').set(auth).send({})).status).toBe(403);
      expect((await request(app).get('/api/earnings/me').set(auth)).status).toBe(403);
    });

    it('PATCH /views needs NO auth (it passes the guards and fails on validation, not 401)', async () => {
      const res = await request(app).patch('/api/submissions/65f000000000000000005001/views').send({});
      expect(res.status).toBe(400);
    });
  });
});
