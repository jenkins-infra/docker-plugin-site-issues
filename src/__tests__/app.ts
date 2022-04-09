import test from 'ava';
import request from 'supertest';
import { getRoutes } from 'get-routes';
import app from '../app.js';
import { DB } from '../db.js';
import * as td from 'testdouble';

test.before(() => {
  const db = td.object('DB') as DB;
  app.set('db', db);
  td.when(db.getIssuesForPlugin('configuration-as-code')).thenResolve([
    {
      'type': 'github',
      'reference': 'jenkinsci/configuration-as-code-plugin',
      'viewUrl': 'https://github.com/jenkinsci/configuration-as-code-plugin/issues',
      'reportUrl': 'https://github.com/jenkinsci/configuration-as-code-plugin/issues/new/choose',
    },
    {
      'type': 'jira',
      'reference': '23170',
      'viewUrl': 'https://issues.jenkins.io/issues/?jql=component=23170',
    },
  ]);
  td.when(db.getJiraIssues(23170)).thenResolve([]);
  td.when(db.getGithubIssues('jenkinsci/configuration-as-code-plugin')).thenResolve([]);
});

test('app > /info > should return 200 with commit and version', async (t) => {
  const response = await request(app).get('/info');
  t.true(typeof response.body.commit !== 'undefined');
  t.true(typeof response.body.version !== 'undefined');
  t.deepEqual(response.status, 200);
  // TODO: expect(response.header['content-type']).toMatch(/\/json/);
});

test('app >/info/healthcheck > should return 200', async (t) => {
  const response = await request(app).get('/info/healthcheck');
  t.deepEqual(response.text, 'OK');
  t.deepEqual(response.status, 200);
  // TODO: expect(response.header['content-type']).toMatch(/text\/plain/);
});

test('app > /api/plugins/:plugin/issues/open > should return 200', async (t) => {
  const response = await request(app).get('/api/plugins/configuration-as-code/issues/open');
  t.deepEqual(response.body, { issues: [] });
  t.deepEqual(response.status, 200);
  // TODO: expect(response.header['content-type']).toMatch(/\/json/);
});

test('app > should have all the routes', (t) => {
  t.deepEqual(getRoutes(app), {
    delete: [],
    get: [
      '/',
      '/info/healthcheck',
      '/info/routes',
      '/info',
      '/api/plugins/:plugin/issues/open',
    ],
    patch: [],
    post: [],
    put: [],
  });
});
