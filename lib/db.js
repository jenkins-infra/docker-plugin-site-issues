const axios = require('axios');
const config = require('./config.js');

const quoteStr = (str) => `"${str.replace('"', '\\"')}"`;

async function getPluginInfo(pluginName) {
  const response = await axios.get('https://updates.jenkins.io/update-center.actual.json').then((response) => response.data);
  if (response.plugins.hasOwnProperty(pluginName)) {
    return response.plugins[pluginName];
  }
}

async function getIssuesForPlugin(pluginName) {
  const response = await axios.get('https://reports.jenkins.io/issues.index.json').then(response => response.data);
  if (response.hasOwnProperty(pluginName)) {
    return response[pluginName];
  }
}

async function getJiraIssues(componentId, statuses = ['Open', 'In Progress', 'Reopened']) {
  const maxResults = 100;
  const startAt = 0;

  const axiosOptions = {
    method: 'get',
    url: `${config.jira.url.replace(/\/+$/, '')}/rest/api/2/search`,
    auth: {
      username: config.jira.username,
      password: config.jira.password
    },
    params: {
      startAt,
      maxResults,
      jql: `project=JENKINS AND status in (${statuses.map(quoteStr).join(',')}) AND component=${componentId}`
    }
  };
  const response = await axios(axiosOptions).then(response => response.data);
  return response;
}

module.exports = {
  getPluginInfo,
  getIssuesForPlugin,
  getJiraIssues
};
