import path from 'path';
import { readFileSync } from 'fs';

import axios, { Method } from 'axios';
import { graphql } from '@octokit/graphql';
import { createAppAuth } from '@octokit/auth-app';
import { request as githubRequest } from '@octokit/request';
import memoize from 'timed-memoize';

import config from './config';

const quoteStr = (str: string) => `"${str.replace('"', '\\"')}"`;

const GRAPHQL_QUERY_GET_ISSUES = readFileSync(path.join(__dirname, '..', '..', 'graphql', 'getGithubIssues.graphql')).toString();

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

async function getJiraIssuesUncached(componentId: number, statuses = ['Open', 'In Progress', 'Reopened']): Promise<Issue[]> {
  const maxResults = 100;
  const startAt = 0;

  const axiosOptions = {
    method: 'get' as Method,
    url: `${config.jira.url.replace(/\/+$/, '')}/rest/api/2/search`,
    auth: {
      username: config.jira.username,
      password: config.jira.password,
    },
    params: {
      startAt,
      maxResults,
      jql: `project=JENKINS AND status in (${statuses.map(quoteStr).join(',')}) AND component=${componentId}`,
    },
  };
  // TODO - loop through all the pages
  // if (obj.getInt("startAt") + jsonIssues.length() < obj.getInt("total")) {
  //   jiraIssues.issues.addAll(getIssues(pluginName, startAt + maxResults).issues);
  // }
  const response = await axios(axiosOptions).then((response) => response.data);
  return response.issues.map((issue: { key: string; fields: { issuetype?: { name?: string; }; priority?: { name?: string; }; status?: { status?: string; }; resolution: { name?: string; }; summary?: string; assignee?: { displayName?: string; }; reporter?: { displayName?: string; }; created: string; updated: string; }; }) => ({
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
}
export const getJiraIssues = memoize(getJiraIssuesUncached, { timeout: 30 * 60 * 1000 });

const getGraphqlClient = memoize(async () => {
  const { data: installations } = await createAppAuth({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  }).hook(githubRequest, 'GET /app/installations');
  const graphqlWithAuth = graphql.defaults({
    request: {
      hook: createAppAuth({
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId: installations[0].id,
      }).hook,
    },
  });
  return graphqlWithAuth;
}, { timeout: -1 });

async function getGithubIssuesUncached(reference: string): Promise<Issue[]> {
  const [owner, repository] = reference.split('/');
  const issues = [];
  let hasNextPage = true;
  let after = null;

  const graphqlClient = await getGraphqlClient();

  while (hasNextPage) {
    // eslint-disable-next-line no-await-in-loop
    const data = await graphqlClient(
      GRAPHQL_QUERY_GET_ISSUES,
      {
        cursor: after, owner, name: repository,
      },
    ) as any;
    issues.push(...data.organization.repository.issues.nodes.map((issue: { key: any; issueTypes: { nodes: { name: string; }[]; }; resolution: any; status: any; summary: any; assignees: { nodes: { name: string; }[]; }; reporter: { login: any; }; createdAt: any; updatedAt: any; url: any; }) => ({
      key: `#${issue.key}`,
      issueType: issue.issueTypes?.nodes.map((n: { name: string }) => n.name).join(', '),
      priority: '',
      resolution: issue.resolution,
      status: issue.status,
      summary: issue.summary,
      assignee: issue.assignees.nodes.map((n: { name: string }) => n.name).join(', '),
      reporter: issue.reporter.login,
      created: issue.createdAt,
      updated: issue.updatedAt,
      url: issue.url,
    })));
    hasNextPage = data.organization.repository.issues.pageInfo.hasNextPage;
    after = data.organization.repository.issues.pageInfo.endCursor;
  }

  return issues;
}
export const getGithubIssues = memoize(getGithubIssuesUncached, { timeout: 30 * 60 * 1000 });
