import express from 'express';
import asyncHandler from 'express-async-handler';
import db from '../lib/db';

const router = express.Router();

/* GET issues listing. */
router.get('/:plugin/open', asyncHandler(async (req, res): Promise<void> => {
  const pluginTrackers = await db.getIssuesForPlugin(req.params.plugin);
  if (!pluginTrackers) {
    res.status(404).send('No such plugin');
    return;
  }
  const promises = [];
  for (const tracker of pluginTrackers) {
    if (tracker.type === 'jira') {
      promises.push(db.getJiraIssues(tracker.reference));
      continue;
    }
    if (tracker.type === 'github') {
      promises.push(db.getGithubIssues(tracker.reference));
      continue;
    }
  }
  const issues = await Promise.all(promises)
    .then((issues) => issues.flat())
    .then((issues) => issues.sort((a, b) => Date.parse(b.created) - Date.parse(a.created) || Date.parse(b.updated) - Date.parse(a.updated)));
  res.json({ issues });
}));

export default router;
