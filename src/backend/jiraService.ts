import api, { route, type Route } from "@forge/api";
import type {
  AutoAssignResult,
  GetIssuesPayload,
  GetProjectsPayload,
  GetTeamPayload,
  JiraPriority,
  JiraProject,
  JiraSearchJqlResponse,
  JiraUser,
  TeamMemberStats,
} from "../shared/types";
import { computeStats, toIssueView } from "./issueUtils";
import { RequestInit } from "node-fetch";

const SEARCH_PAGE_SIZE = 100;

async function requestJiraVoid(path: Route, init?: RequestInit): Promise<void> {
  const response = await api.asUser().requestJira(path, init);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jira API ${response.status}: ${text}`);
  }
}

async function requestJira<T>(path: Route, init?: RequestInit): Promise<T> {
  const response = await api.asUser().requestJira(path, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Jira API ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Jira API: invalid JSON response: ${text.slice(0, 200)}`);
  }
}

export async function fetchProjects(): Promise<GetProjectsPayload> {
  const data = await requestJira<{ values: JiraProject[] }>(
    route`/rest/api/3/project/search?maxResults=50&orderBy=name`,
  );
  return { projects: data.values ?? [] };
}

export async function fetchProjectIssues(
  projectKey: string,
): Promise<GetIssuesPayload> {
  const fields = [
    "summary",
    "status",
    "assignee",
    "priority",
    "duedate",
    "updated",
    "created",
  ];

  const collected: JiraSearchJqlResponse["issues"] = [];
  let nextPageToken: string | undefined;

  do {
    const body: Record<string, unknown> = {
      jql: `project = "${projectKey}" ORDER BY updated DESC`,
      maxResults: SEARCH_PAGE_SIZE,
      fields,
    };
    if (nextPageToken) {
      body.nextPageToken = nextPageToken;
    }

    const data = await requestJira<JiraSearchJqlResponse>(
      route`/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    collected.push(...(data.issues ?? []));
    nextPageToken =
      data.isLast === false && data.nextPageToken
        ? data.nextPageToken
        : undefined;
  } while (nextPageToken);

  const issues = collected.map(toIssueView);
  return { issues, stats: computeStats(issues) };
}

export async function fetchAssignableUsers(
  projectKey: string,
): Promise<JiraUser[]> {
  const data = await requestJira<JiraUser[]>(
    route`/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`,
  );
  return (data ?? []).filter((u) => u.active !== false);
}

export async function fetchPriorities(): Promise<JiraPriority[]> {
  return requestJira<JiraPriority[]>(route`/rest/api/3/priority`);
}

async function findPriorityId(name: string): Promise<string> {
  const priorities = await fetchPriorities();
  const match = priorities.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  if (!match) throw new Error(`Priority "${name}" not found`);
  return match.id;
}

export async function assignIssue(
  issueKey: string,
  accountId: string,
): Promise<void> {
  await requestJiraVoid(route`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { assignee: { accountId } },
    }),
  });
}

export async function updateIssuePriority(
  issueKey: string,
  priorityName: "Medium" | "High",
): Promise<void> {
  const priorityId = await findPriorityId(priorityName);
  await requestJiraVoid(route`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { priority: { id: priorityId } },
    }),
  });
}

function activityFromIssues(
  count: number,
  recentUpdates: number,
): TeamMemberStats["activityLabel"] {
  const score = count * 10 + recentUpdates * 15;
  if (score >= 50) return "high";
  if (score >= 20) return "medium";
  return "low";
}

export async function fetchTeamStats(
  projectKey: string,
): Promise<GetTeamPayload> {
  const [{ issues }, users] = await Promise.all([
    fetchProjectIssues(projectKey),
    fetchAssignableUsers(projectKey),
  ]);

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const memberMap = new Map<string, TeamMemberStats>();

  for (const user of users) {
    memberMap.set(user.accountId, {
      user,
      assignedCount: 0,
      activityScore: 0,
      activityLabel: "low",
    });
  }

  for (const issue of issues) {
    const assignee = issue.fields.assignee;
    if (!assignee) continue;

    let entry = memberMap.get(assignee.accountId);
    if (!entry) {
      entry = {
        user: assignee,
        assignedCount: 0,
        activityScore: 0,
        activityLabel: "low",
      };
      memberMap.set(assignee.accountId, entry);
    }

    entry.assignedCount += 1;
    const updated = new Date(issue.fields.updated).getTime();
    if (now - updated <= sevenDaysMs) {
      entry.activityScore += 15;
    }
    entry.activityScore += 10;
  }

  const members = Array.from(memberMap.values())
    .map((m) => ({
      ...m,
      activityLabel: activityFromIssues(
        m.assignedCount,
        Math.floor(m.activityScore / 15),
      ),
    }))
    .sort((a, b) => b.assignedCount - a.assignedCount);

  return { members };
}

export async function autoAssignUnassigned(
  projectKey: string,
): Promise<AutoAssignResult> {
  const [{ issues }, users] = await Promise.all([
    fetchProjectIssues(projectKey),
    fetchAssignableUsers(projectKey),
  ]);

  const activeUsers = users.filter((u) => u.active !== false);
  if (activeUsers.length === 0) {
    throw new Error("No assignable users in project");
  }

  const unassigned = issues.filter((i) => i.problemType === "unassigned");
  const result: AutoAssignResult = { assigned: [], failed: [] };

  for (let i = 0; i < unassigned.length; i++) {
    const issue = unassigned[i];
    const user = activeUsers[i % activeUsers.length];
    try {
      await assignIssue(issue.key, user.accountId);
      result.assigned.push({
        issueKey: issue.key,
        accountId: user.accountId,
        displayName: user.displayName,
      });
    } catch (err) {
      result.failed.push({
        issueKey: issue.key,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}

export async function fetchAssignableUsersForProject(
  projectKey: string,
): Promise<JiraUser[]> {
  return fetchAssignableUsers(projectKey);
}
