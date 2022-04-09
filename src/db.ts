import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { request as githubRequest } from '@octokit/request';
import JiraApi from 'jira-client';
import { MemoizeExpiring } from 'typescript-memoize';
import NodeCache from 'node-cache';

import config from './config.js';

const DEFAULT_TIMEOUT = 60 * 60 * 1000;

function quoteStr(str: string) {
  return `"${str.replace('"', '\\"')}"`;
}

const cache = new NodeCache({
  stdTTL: DEFAULT_TIMEOUT,
});

export type Issue = {
  readonly key: string;

  readonly issueTypes: string[];

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

type IssueIndex = {
  readonly type: string;
  readonly reference: string;
  readonly viewUrl?: string;
  readonly reportUrl?: string;
};

export interface IDB {
  getIssuesForPlugin(pluginName: string) : Promise<Array<IssueIndex> | null>;
  getJiraIssues(component: number | string, startAt: number, statuses: Array<string>): Promise<Issue[]>;
  getGithubIssues(reference: string): Promise<Issue[]>;
}

export class DB implements IDB {
  @MemoizeExpiring(DEFAULT_TIMEOUT)
  async getIssuesForPlugin(pluginName: string) : Promise<Array<IssueIndex> | null> {
    let pluginIssuesIndex : Record<string, Array<IssueIndex>> | undefined = cache.get('issues.index.json');
    if (!pluginIssuesIndex) {
      pluginIssuesIndex = await axios.get('https://reports.jenkins.io/issues.index.json')
        .then((response) => response.data || {});
      cache.set('issues.index.json', pluginIssuesIndex);
    }
    if (pluginIssuesIndex && Object.prototype.hasOwnProperty.call(pluginIssuesIndex, pluginName)) {
      return pluginIssuesIndex[pluginName];
    }
    return null;
  }

  @MemoizeExpiring(DEFAULT_TIMEOUT, (component, startAt, statues) => JSON.stringify([component, startAt, statues]))
  async getJiraIssues(component: number | string, startAt = 0, statuses = ['Open', 'In Progress', 'Reopened']): Promise<Issue[]> {
    const maxResults = 1000;

    const parsedUrl = new URL(config.jira.url);
    const jira = new JiraApi({
      protocol: parsedUrl.protocol,
      host: parsedUrl.host,
      port: parsedUrl.port,
      base: parsedUrl.pathname.replace(/^\/+/g, ''),
    });

    const response = await jira.searchJira(
      `project=JENKINS AND status in (${statuses.map(quoteStr).join(',')}) AND component=${component}`, {
        startAt,
        maxResults,
        fields: ['key', 'components', 'summary', 'assignee', 'reporter', 'priority', 'status', 'resolution', 'created', 'updated'],
      },
    );

    const issues = response.issues.map((issue: any) => ({
      key: issue.key,
      issueTypes: [issue?.fields?.issuetype?.name],
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
      issues.push(...await this.getJiraIssues(component, startAt + maxResults, statuses));
    }
    return issues;
  }

  @MemoizeExpiring(DEFAULT_TIMEOUT)
  private async getRestClient() {
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

  @MemoizeExpiring(DEFAULT_TIMEOUT)
  async getGithubIssues(reference: string): Promise<Issue[]> {
    const [owner, repo] = reference.split('/');

    const octokit = await this.getRestClient();
    const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
      per_page: 100,
      owner,
      repo,
      state: 'open',
    });

    const returnedIssues : Array<Issue> = [];
    for await (const { data: issues } of iterator) {
      for (const issue of issues) {
        let labels: string[] = [];
        if (issue.labels && Array.isArray(issue.labels) && issue.labels.length > 0) {
          labels = issue.labels.map((n: any) => {
            if (typeof n === 'string') {
              return n;
            }

            return n.name || '';
          });
        }
        returnedIssues.push({
          key: `#${issue.number}`,
          issueTypes: labels,
          priority: '',
          resolution: issue.state,
          status: issue.state,
          summary: issue.title,
          assignee: issue.assignees?.map((n: any) => n?.login || '').join(', ') || '',
          reporter: issue.user?.login || '',
          created: issue.created_at,
          updated: issue.updated_at,
          url: issue.html_url,
        });
      }
    }
    return returnedIssues;
  }
}
