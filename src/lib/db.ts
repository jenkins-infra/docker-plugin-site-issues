import axios, { Method } from 'axios';
import config from './config';

const quoteStr = (str: string) => `"${str.replace('"', '\\"')}"`;

async function getPluginInfo(pluginName: string) {
  const response = await axios.get('https://updates.jenkins.io/update-center.actual.json').then((response) => response.data);
  if (response.plugins.hasOwnProperty(pluginName)) {
    return response.plugins[pluginName];
  }
}

async function getIssuesForPlugin(pluginName: string) {
  const response = await axios.get('https://reports.jenkins.io/issues.index.json').then((response) => response.data);
  if (response.hasOwnProperty(pluginName)) {
    return response[pluginName];
  }
}

async function getJiraIssues(componentId: number, statuses = ['Open', 'In Progress', 'Reopened']): Promise<any> {
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

export default {
  getPluginInfo,
  getIssuesForPlugin,
  getJiraIssues,
};
