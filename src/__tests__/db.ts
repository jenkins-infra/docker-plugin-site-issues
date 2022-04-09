import test from 'ava';
// @ts-ignore
import { setupTests } from '../ava-nock/src/index.js';
import { DB } from '../db.js';

setupTests(test);

test('db > getGithubIssues > succeeds', async (t) => {
  const db = new DB();
  const issues = await db.getGithubIssues('jenkinsci/configuration-as-code-plugin');
  t.snapshot(issues);
});

test('db > getJiraIssues > succeeds', async (t) => {
  const db = new DB();
  const issues = await db.getJiraIssues(21481);
  t.snapshot(issues);
});

test('db > getIssuesForPlugin > succeeds', async (t) => {
  const db = new DB();
  const issues = await db.getIssuesForPlugin('configuration-as-code');
  t.snapshot(issues);
});
