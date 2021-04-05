import { getMockReq, getMockRes } from '@jest-mock/express';
import {
  indexRoute,
  healthcheckRoute,
  infoRoute,
  issuesRoute,
} from '../routes';

const jestPlayback = require('jest-playback');

jest.mock('../db');

jestPlayback.setup(__dirname);

describe('routes', () => {
  describe('GET /issues/:plugin/open', () => {
    it('should return 404 on missing plugin', async () => {
      const req = getMockReq({ params: { plugin: '---missing-plugin' } });
      const { res } = getMockRes();

      await issuesRoute(req, res);

      expect((res.json as jest.Mock).mock.calls).toMatchSnapshot();
      expect((res.send as jest.Mock).mock.calls).toMatchSnapshot();
      expect((res.type as jest.Mock).mock.calls).toMatchSnapshot();
    });

    it('should return 200', async () => {
      const req = getMockReq({ params: { plugin: 'configuration-as-code' } });
      const { res } = getMockRes();

      await issuesRoute(req, res);

      expect((res.json as jest.Mock).mock.calls).toMatchSnapshot();
      expect((res.send as jest.Mock).mock.calls).toMatchSnapshot();
      expect((res.type as jest.Mock).mock.calls).toMatchSnapshot();
    });
  });

  describe('GET /', () => {
    it('should return 200', async () => {
      const req = getMockReq();
      const { res } = getMockRes();

      indexRoute(req, res);

      expect((res.send as jest.Mock)).toHaveBeenCalledWith('OK');
      expect((res.type as jest.Mock)).toHaveBeenCalledWith('text');
    });
  });

  describe('GET /healthcheck', () => {
    it('should return 200', async () => {
      const req = getMockReq();
      const { res } = getMockRes();

      healthcheckRoute(req, res);

      expect((res.send as jest.Mock)).toHaveBeenCalledWith('OK');
      expect((res.type as jest.Mock)).toHaveBeenCalledWith('text');
    });
  });

  describe('GET /info', () => {
    it('should return 200 with commit and version', async () => {
      const req = getMockReq();
      const { res } = getMockRes();

      infoRoute(req, res);

      expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty('commit');
      expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty('version');
    });
  });
});
