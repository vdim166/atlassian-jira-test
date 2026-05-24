import Resolver from '@forge/resolver';
import {
  assignIssue,
  autoAssignUnassigned,
  fetchAssignableUsersForProject,
  fetchProjectIssues,
  fetchProjects,
  fetchTeamStats,
  updateIssuePriority,
} from './backend/jiraService';

const resolver = new Resolver();

resolver.define('getProjects', async () => fetchProjects());

resolver.define('getIssues', async ({ payload }: { payload: { projectKey: string } }) => {
  if (!payload?.projectKey) throw new Error('projectKey is required');
  return fetchProjectIssues(payload.projectKey);
});

resolver.define('getTeam', async ({ payload }: { payload: { projectKey: string } }) => {
  if (!payload?.projectKey) throw new Error('projectKey is required');
  return fetchTeamStats(payload.projectKey);
});

resolver.define('getAssignableUsers', async ({ payload }: { payload: { projectKey: string } }) => {
  if (!payload?.projectKey) throw new Error('projectKey is required');
  const users = await fetchAssignableUsersForProject(payload.projectKey);
  return { users };
});

resolver.define(
  'assignIssue',
  async ({ payload }: { payload: { issueKey: string; accountId: string } }) => {
    const { issueKey, accountId } = payload ?? {};
    if (!issueKey || !accountId) throw new Error('issueKey and accountId are required');
    await assignIssue(issueKey, accountId);
    return { success: true };
  },
);

resolver.define(
  'updatePriority',
  async ({ payload }: { payload: { issueKey: string; priorityName: 'Medium' | 'High' } }) => {
    const { issueKey, priorityName } = payload ?? {};
    if (!issueKey || !priorityName) throw new Error('issueKey and priorityName are required');
    await updateIssuePriority(issueKey, priorityName);
    return { success: true };
  },
);

resolver.define(
  'autoAssignUnassigned',
  async ({ payload }: { payload: { projectKey: string } }) => {
    if (!payload?.projectKey) throw new Error('projectKey is required');
    return autoAssignUnassigned(payload.projectKey);
  },
);

export const handler = resolver.getDefinitions();
