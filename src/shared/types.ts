export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
  active?: boolean;
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory?: {
    key: string;
    name: string;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  assignee: JiraUser | null;
  priority: JiraPriority | null;
  duedate: string | null;
  updated: string;
  created: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
}

export interface JiraSearchJqlResponse {
  issues: JiraIssue[];
  nextPageToken?: string;
  isLast?: boolean;
}

export interface JiraProjectsResponse {
  values?: JiraProject[];
  projects?: JiraProject[];
}

export type IssueProblemType = "unassigned" | "low_priority_deadline" | null;

export interface IssueView extends JiraIssue {
  problemType: IssueProblemType;
}

export interface ProjectStats {
  total: number;
  unassigned: number;
  lowPriorityDeadline: number;
  byStatus: Record<string, number>;
}

export interface TeamMemberStats {
  user: JiraUser;
  assignedCount: number;
  activityScore: number;
  activityLabel: "high" | "medium" | "low";
}

export interface GetProjectsPayload {
  projects: JiraProject[];
}

export interface GetIssuesPayload {
  issues: IssueView[];
  stats: ProjectStats;
}

export interface GetTeamPayload {
  members: TeamMemberStats[];
}

export interface AssignIssuePayload {
  issueKey: string;
  accountId: string;
}

export interface UpdatePriorityPayload {
  issueKey: string;
  priorityName: "Medium" | "High";
}

export interface AutoAssignPayload {
  projectKey: string;
}

export interface AutoAssignResult {
  assigned: Array<{ issueKey: string; accountId: string; displayName: string }>;
  failed: Array<{ issueKey: string; error: string }>;
}

export type ResolverRequest =
  | { name: "getProjects" }
  | { name: "getIssues"; payload: { projectKey: string } }
  | { name: "getTeam"; payload: { projectKey: string } }
  | { name: "assignIssue"; payload: AssignIssuePayload }
  | { name: "updatePriority"; payload: UpdatePriorityPayload }
  | { name: "autoAssignUnassigned"; payload: AutoAssignPayload };
