import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { request as githubRequest } from '@octokit/request';
import JiraApi from 'jira-client';
import memoize from 'timed-memoize';

import config from './config';

const quoteStr = (str: string) => `"${str.replace('"', '\\"')}"`;

export type Issue = {
  readonly key: string;

  readonly issueType: string;

  readonly priority: string;

  readonly status: string;

  readonly resolution: string;

  readonly summary: string;

  readonly assignee: string;

  readonly reporter: string;

  readonly created: string;

  readonly updated: string;

  readonly url: string;
};

const getIssuesIndex = memoize(() => axios.get('https://reports.jenkins.io/issues.index.json').then((response) => response.data), { timeout: 60 * 60 * 1000 });

async function getIssuesForPluginUncached(pluginName: string) {
  const response = await getIssuesIndex();
  if (Object.prototype.hasOwnProperty.call(response, pluginName)) {
    return response[pluginName];
  }
  return null;
}
export const getIssuesForPlugin = memoize(getIssuesForPluginUncached, { timeout: 30 * 60 * 1000 });

async function getJiraIssuesUncached(componentId: number, startAt = 0, statuses = ['Open', 'In Progress', 'Reopened']): Promise<Issue[]> {
  const maxResults = 100;

  const parsedUrl = new URL(config.jira.url);
  const jira = new JiraApi({
    protocol: parsedUrl.protocol,
    host: parsedUrl.host,
    port: parsedUrl.port,
    base: parsedUrl.pathname.replace(/^\/+/g, ''),
    username: config.jira.username,
    password: config.jira.password,
  });
  const response = await jira.searchJira(`project=JENKINS AND status in (${statuses.map(quoteStr).join(',')}) AND component=${componentId}`, { startAt, maxResults });

  const issues = response.issues.map((issue: any) => ({
    key: issue.key,
    issueType: issue?.fields?.issuetype?.name,
    priority: issue?.fields?.priority?.name,
    status: issue?.fields?.status?.status,
    resolution: issue?.fields?.resolution?.name,
    summary: issue?.fields?.summary,
    assignee: issue?.fields?.assignee?.displayName,
    reporter: issue?.fields?.reporter?.displayName,
    created: issue?.fields?.created,
    updated: issue?.fields?.updated,
    url: `${config.jira.url.replace(/\/+$/, '')}/browse/${issue.key}`,
  }));
  if (response.startAt + response.issues.length < response.total) {
    issues.push(...await getJiraIssuesUncached(componentId, startAt + maxResults, statuses));
  }
  return issues;
}
export const getJiraIssues = memoize(getJiraIssuesUncached, { timeout: 30 * 60 * 1000 });

async function getRestClientUncached() {
  const { data: installations } = await createAppAuth({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  }).hook(githubRequest.defaults({
    baseUrl: config.github.server,
  }), 'GET /app/installations');

  return new Octokit({
    baseUrl: config.github.server,
    request: {
      hook: createAppAuth({
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId: installations[0].id,
      }).hook,
    },
  });
}
const getRestClient = memoize(getRestClientUncached, { timeout: -1 });

async function getGithubIssuesUncached(reference: string): Promise<Issue[]> {
  const [owner, repository] = reference.split('/');

  const octokit = await getRestClient();
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', { owner, repo: repository }) || [];

  return issues.map((issue) => ({
    key: `#${issue.number}`,
    issueType: issue.labels?.map((n) => n.name).join(', '),
    priority: '',
    resolution: issue.state,
    status: issue.state,
    summary: issue.title,
    assignee: issue.assignees?.map((n) => n?.login || '').join(', ') || '',
    reporter: issue.user?.login || '',
    created: issue.created_at,
    updated: issue.updated_at,
    url: issue.html_url,
  }));
}
export const getGithubIssues = memoize(getGithubIssuesUncached, { timeout: 30 * 60 * 1000 });
