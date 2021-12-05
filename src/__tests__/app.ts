import request from 'supertest';
import { getRoutes } from 'get-routes';
import app from '../app';

jest.mock('../db');

describe('app', () => {
  it('should have all the routes', () => {
    expect(getRoutes(app)).toEqual({
      delete: [],
      get: ['/', '/healthcheck', '/info', '/api/plugins/:plugin/issues/open'],
      patch: [],
      post: [],
      put: [],
    });
  });

  describe('GET /issues/:plugin/open', () => {
    it('should return 200', async () => {
      const response = await request(app).get('/api/plugins/configuration-as-code/issues/open');
      expect(response.body).toMatchSnapshot();
      expect(response.status).toEqual(200);
      expect(response.header['content-type']).toMatch(/\/json/);
    });
  });

  describe('GET /healthcheck', () => {
    it('should return 200', async () => {
      const response = await request(app).get('/healthcheck');
      expect(response.text).toEqual('OK');
      expect(response.status).toEqual(200);
      expect(response.header['content-type']).toMatch(/text\/plain/);
    });
  });

  describe('GET /info', () => {
    it('should return 200 with commit and version', async () => {
      const response = await request(app).get('/info');
      expect(response.body).toHaveProperty('commit');
      expect(response.body).toHaveProperty('version');
      expect(response.status).toEqual(200);
      expect(response.header['content-type']).toMatch(/\/json/);
    });
  });
});
