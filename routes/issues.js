const express = require('express');

const router = express.Router();
const asyncHandler = require('express-async-handler');
const db = require('../lib/db');

/* GET issues listing. */
router.get('/:plugin/open', asyncHandler(async (req, res) => {
  const pluginTrackers = await db.getIssuesForPlugin(req.params.plugin);
  if (!pluginTrackers) {
    res.status(404).send('No such plugin');
    return;
  }
  const promises = [];
  for (const tracker of pluginTrackers) {
    if (tracker.type === "jira") {
      promises.push(db.getJiraIssues(tracker.reference))
      continue;
    }
  }
  res.json(await Promise.all(promises));
}));

module.exports = router;
