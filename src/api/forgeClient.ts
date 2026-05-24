import { invoke } from "@forge/bridge";
import type {
  AutoAssignResult,
  GetIssuesPayload,
  GetProjectsPayload,
  GetTeamPayload,
  JiraUser,
} from "../shared/types";
import { InvokePayload } from "@forge/bridge/out/types";

async function call<T>(name: string, payload?: InvokePayload): Promise<T> {
  return invoke<T>(name, payload);
}

export const forgeApi = {
  getProjects: () => call<GetProjectsPayload>("getProjects"),

  getIssues: (projectKey: string) =>
    call<GetIssuesPayload>("getIssues", { projectKey }),

  getTeam: (projectKey: string) =>
    call<GetTeamPayload>("getTeam", { projectKey }),

  getAssignableUsers: (projectKey: string) =>
    call<{ users: JiraUser[] }>("getAssignableUsers", { projectKey }),

  assignIssue: (issueKey: string, accountId: string) =>
    call<{ success: boolean }>("assignIssue", { issueKey, accountId }),

  updatePriority: (issueKey: string, priorityName: "Medium" | "High") =>
    call<{ success: boolean }>("updatePriority", { issueKey, priorityName }),

  autoAssignUnassigned: (projectKey: string) =>
    call<AutoAssignResult>("autoAssignUnassigned", { projectKey }),
};
