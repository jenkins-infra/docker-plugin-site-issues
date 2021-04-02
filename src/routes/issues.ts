import express from 'express';
import asyncHandler from 'express-async-handler';
import db from '../lib/db';

const router = express.Router();

/* GET issues listing. */
router.get('/:plugin/open', asyncHandler(async (req, res) => {
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
  }
  res.json({
    issues: await Promise.all(promises),
  });
}));

export default router;
