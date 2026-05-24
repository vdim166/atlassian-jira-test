import type { IssueProblemType, IssueView, JiraIssue, ProjectStats } from '../shared/types';

const LOW_PRIORITIES = new Set(['Low', 'Lowest', 'Trivial']);
const DEADLINE_DAYS_THRESHOLD = 7;

export function isLowPriority(priorityName: string | undefined | null): boolean {
  if (!priorityName) return false;
  return LOW_PRIORITIES.has(priorityName);
}

export function isDeadlineClose(duedate: string | null): boolean {
  if (!duedate) return false;
  const due = new Date(duedate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= DEADLINE_DAYS_THRESHOLD;
}

export function detectProblem(issue: JiraIssue): IssueProblemType {
  const { assignee, priority, duedate } = issue.fields;
  if (!assignee) return 'unassigned';
  if (isLowPriority(priority?.name) && isDeadlineClose(duedate)) {
    return 'low_priority_deadline';
  }
  return null;
}

export function toIssueView(issue: JiraIssue): IssueView {
  return { ...issue, problemType: detectProblem(issue) };
}

export function computeStats(issues: IssueView[]): ProjectStats {
  const byStatus: Record<string, number> = {};
  let unassigned = 0;
  let lowPriorityDeadline = 0;

  for (const issue of issues) {
    const statusName = issue.fields.status?.name ?? 'Unknown';
    byStatus[statusName] = (byStatus[statusName] ?? 0) + 1;
    if (issue.problemType === 'unassigned') unassigned += 1;
    if (issue.problemType === 'low_priority_deadline') lowPriorityDeadline += 1;
  }

  return {
    total: issues.length,
    unassigned,
    lowPriorityDeadline,
    byStatus,
  };
}

export const DEADLINE_THRESHOLD_DAYS = DEADLINE_DAYS_THRESHOLD;
