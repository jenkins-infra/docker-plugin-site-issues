import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { request as githubRequest } from '@octokit/request';
import { defaultSchema } from 'hast-util-sanitize';
import JiraApi from 'jira-client';
import normalizeUrl from 'normalize-url';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkAdmonitions from 'remark-github-beta-blockquote-admonitions';
import remarkEmoji from 'remark-emoji';
import remarkGithub from 'remark-github';
import { Memoize } from 'typescript-memoize';

import config from './config.js';

const DEFAULT_TIMEOUT = 60 * 60 * 1000;

function quoteStr(str: string) {
  return `"${str.replace('"', '\\"')}"`;
}

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

export type Release = {
  readonly tagName: string;
  readonly name: string;
  readonly publishedAt: string;
  readonly htmlURL: string;
  readonly bodyHTML: string;
};

type Dependency = {
  readonly name: string;
  readonly optional: boolean;
  readonly version: number;
};

type Developer = {
  readonly name: string;
  readonly optional: boolean;
  readonly version: string;
};

export type PluginInfo = {
  readonly buildDate: string;
  readonly defaultBranch: string;
  readonly dependencies: Array<Dependency>;
  readonly developers: Array<Developer>;
  readonly excerpt: string;
  readonly gav: string;
  readonly issueTrackers: Array<IssueIndex>;
  readonly labels: Array<string>;
  readonly minimumJavaVersion: string;
  readonly name: string;
  readonly popularity: number;
  readonly previousTimestamp: Date;
  readonly previousVersion: number;
  readonly releaseTimestamp: Date;
  readonly requiredCore: string;
  readonly scm: string;
  readonly sha1: string;
  readonly sha256: string;
  readonly size: number;
  readonly title: string;
  readonly url: string;
  readonly version: string;
  readonly wiki: string;
};

export interface IDB {
  getJiraIssues(component: number | string, startAt: number, statuses: Array<string>): Promise<Issue[]>;
  getGithubIssues(reference: string): Promise<Issue[]>;
}

export function processMarkdown(content: string, baseUrl: string) {
  const schema = Object.assign(defaultSchema, { });
  if (schema.attributes) {
    schema.attributes['*']?.push('className');
  }

  const admonitionConfig = {
    classNameMaps: {
      block: (title: string) => `admonition admonition-${title.toLowerCase()}`,
      title: (title: string) => `admonition-title admonition-title-${title.toLowerCase()}`,
    },
  };
  return remark()
    .use(remarkEmoji)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkAdmonitions, admonitionConfig)
    .use(remarkGithub, {
      repository: baseUrl,
    })
    .use(remarkHtml, { sanitize: schema })
    .process(content.replaceAll(/<!--.*?-->/g, '').trim())
    .then(r => r.toString().trim());
}

export class DB implements IDB {
  @Memoize({ tags: ['db'], expiring: DEFAULT_TIMEOUT })
  async getIssuesForPlugin(pluginName: string) : Promise<Array<IssueIndex> | null> {
    const pluginIssuesIndex = await axios.get('https://reports.jenkins.io/issues.index.json')
      .then((response) => response.data || {});
    if (pluginIssuesIndex && Object.prototype.hasOwnProperty.call(pluginIssuesIndex, pluginName)) {
      return pluginIssuesIndex[pluginName];
    }
    return null;
  }


  @Memoize({ tags: ['db'], expiring: DEFAULT_TIMEOUT })
  async getPluginInfo(pluginName: string): Promise<PluginInfo | null> {
    const updateJson = await axios.get('https://updates.jenkins.io/current/update-center.actual.json')
      .then((response) => response?.data?.plugins || {});
    if (updateJson && Object.prototype.hasOwnProperty.call(updateJson, pluginName)) {
      return updateJson[pluginName];
    }
    return null;
  }

  @Memoize({
    tags: ['db'],
    expiring: DEFAULT_TIMEOUT,
    hashFunction: (component, startAt, statues) => JSON.stringify([component, startAt, statues]),
  })
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

  private async getRestClient() {
    const { data: installations } = await createAppAuth({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
    }).hook(githubRequest.defaults({
      baseUrl: config.github.server,
    }), 'GET /app/installations');

    return new Octokit({
      baseUrl: config.github.server,
      authStrategy: createAppAuth,
      auth: {
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId: installations[0].id,
      },
    });
  }

  @Memoize({ tags: ['db'], expiring: DEFAULT_TIMEOUT })
  async getGithubIssues(reference: string): Promise<Issue[]> {
    const [owner, repo] = reference.split('/');

    const octokit = await this.getRestClient();
    const iterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
      per_page: 100,
      owner,
      repo,
      state: 'open',
    });

    const returnedIssues: Array<Issue> = [];
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

  @Memoize({ tags: ['db'], expiring: DEFAULT_TIMEOUT })
  async getGithubReleases(reference: string): Promise<Release[] | null> {
    const [owner, repo] = reference.split('/');

    const octokit = await this.getRestClient();
    const releases = await octokit.rest.repos.listReleases({
      per_page: 10,
      owner,
      repo,
    });

    if (!releases) {return null;}

    const ret: Array<Release> = [];
    for (const release of releases.data) {

      const baseUrl = normalizeUrl(release.html_url + '/../../../issues');
      ret.push({
        tagName: release.tag_name,
        name: release.name || release.tag_name,
        publishedAt: release.published_at || (new Date().getTime()).toString(),
        htmlURL: release.html_url,
        bodyHTML: await processMarkdown(release.body || '', baseUrl),
      });
    }

    return ret;
  }
}
