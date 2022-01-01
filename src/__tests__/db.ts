import * as jestPlayback from 'jest-playback';
import { getIssuesForPlugin, getJiraIssues, getGithubIssues } from '../db';

jestPlayback.setup(__dirname);

describe('db', () => {
  describe('getIssuesForPlugin', () => {
    it('succeeds', async () => {
      jest.setTimeout(60 * 1000);
      const issues = await getIssuesForPlugin('configuration-as-code');
      expect(issues).toMatchSnapshot();
    });
  });

  describe('getJiraIssues', () => {
    it('succeeds', async () => {
      jest.setTimeout(60 * 1000);
      const issues = await getJiraIssues(21481);
      expect(issues).toMatchSnapshot();
    });
  });
  describe('getGithubIssues', () => {
    it('succeeds', async () => {
      jest.setTimeout(60 * 1000);
      const issues = await getGithubIssues('jenkinsci/configuration-as-code-plugin');
      expect(issues).toMatchSnapshot();
    });
  });
});
