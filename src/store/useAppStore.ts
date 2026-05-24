import { create } from "zustand";
import { forgeApi } from "../api/forgeClient";
import type {
  AutoAssignResult,
  IssueView,
  JiraProject,
  JiraUser,
  ProjectStats,
  TeamMemberStats,
} from "../shared/types";

interface LoadingState {
  projects: boolean;
  issues: boolean;
  team: boolean;
  assign: boolean;
  priority: boolean;
  autoAssign: boolean;
}

interface ErrorState {
  projects: string | null;
  issues: string | null;
  team: string | null;
  action: string | null;
}

interface AppState {
  projects: JiraProject[];
  selectedProjectKey: string | null;
  issues: IssueView[];
  stats: ProjectStats | null;
  teamMembers: TeamMemberStats[];
  assignableUsers: JiraUser[];
  loading: LoadingState;
  errors: ErrorState;

  loadProjects: () => Promise<void>;
  selectProject: (key: string) => Promise<void>;
  refreshIssues: () => Promise<void>;
  loadTeam: () => Promise<void>;
  loadAssignableUsers: () => Promise<void>;

  optimisticAssign: (issueKey: string, user: JiraUser) => void;
  optimisticPriority: (issueKey: string, priorityName: string) => void;
  optimisticAutoAssign: (result: AutoAssignResult) => void;
  rollbackIssues: (snapshot: IssueView[]) => void;

  assignIssue: (issueKey: string, accountId: string) => Promise<void>;
  updatePriority: (
    issueKey: string,
    priorityName: "Medium" | "High",
  ) => Promise<void>;
  autoAssignUnassigned: () => Promise<AutoAssignResult>;
  clearActionError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  selectedProjectKey: null,
  issues: [],
  stats: null,
  teamMembers: [],
  assignableUsers: [],
  loading: {
    projects: false,
    issues: false,
    team: false,
    assign: false,
    priority: false,
    autoAssign: false,
  },
  errors: {
    projects: null,
    issues: null,
    team: null,
    action: null,
  },

  loadProjects: async () => {
    set((s) => ({
      loading: { ...s.loading, projects: true },
      errors: { ...s.errors, projects: null },
    }));
    try {
      const { projects } = await forgeApi.getProjects();
      const selected = projects[0]?.key ?? null;
      set({ projects, selectedProjectKey: selected });
      if (selected) await get().selectProject(selected);
    } catch (e) {
      set((s) => ({
        errors: {
          ...s.errors,
          projects: e instanceof Error ? e.message : "Failed to load projects",
        },
      }));
    } finally {
      set((s) => ({ loading: { ...s.loading, projects: false } }));
    }
  },

  selectProject: async (key: string) => {
    set({ selectedProjectKey: key });
    await Promise.all([get().refreshIssues(), get().loadTeam()]);
  },

  refreshIssues: async () => {
    const key = get().selectedProjectKey;
    if (!key) return;
    set((s) => ({
      loading: { ...s.loading, issues: true },
      errors: { ...s.errors, issues: null },
    }));
    try {
      const { issues, stats } = await forgeApi.getIssues(key);
      set({ issues, stats });
    } catch (e) {
      set((s) => ({
        errors: {
          ...s.errors,
          issues: e instanceof Error ? e.message : "Failed to load issues",
        },
      }));
    } finally {
      set((s) => ({ loading: { ...s.loading, issues: false } }));
    }
  },

  loadTeam: async () => {
    const key = get().selectedProjectKey;
    if (!key) return;
    set((s) => ({
      loading: { ...s.loading, team: true },
      errors: { ...s.errors, team: null },
    }));
    try {
      const { members } = await forgeApi.getTeam(key);
      set({ teamMembers: members });
    } catch (e) {
      set((s) => ({
        errors: {
          ...s.errors,
          team: e instanceof Error ? e.message : "Failed to load team",
        },
      }));
    } finally {
      set((s) => ({ loading: { ...s.loading, team: false } }));
    }
  },

  loadAssignableUsers: async () => {
    const key = get().selectedProjectKey;
    if (!key) return;
    try {
      const { users } = await forgeApi.getAssignableUsers(key);
      set({ assignableUsers: users });
    } catch {
      set({ assignableUsers: [] });
    }
  },

  optimisticAssign: (issueKey, user) => {
    set((s) => ({
      issues: s.issues.map((issue) => {
        if (issue.key !== issueKey) return issue;
        const updated: IssueView = {
          ...issue,
          fields: { ...issue.fields, assignee: user },
          problemType: null,
        };
        return updated;
      }),
    }));
  },

  optimisticPriority: (issueKey, priorityName) => {
    set((s) => ({
      issues: s.issues.map((issue) => {
        if (issue.key !== issueKey) return issue;
        return {
          ...issue,
          fields: {
            ...issue.fields,
            priority: {
              id: issue.fields.priority?.id ?? "",
              name: priorityName,
            },
          },
          problemType: null,
        };
      }),
    }));
  },

  optimisticAutoAssign: (result) => {
    set((s) => {
      const map = new Map(result.assigned.map((a) => [a.issueKey, a]));
      return {
        issues: s.issues.map((issue) => {
          const a = map.get(issue.key);
          if (!a) return issue;
          const user: JiraUser = {
            accountId: a.accountId,
            displayName: a.displayName,
          };
          return {
            ...issue,
            fields: { ...issue.fields, assignee: user },
            problemType: null,
          };
        }),
      };
    });
  },

  rollbackIssues: (snapshot) => set({ issues: snapshot }),

  assignIssue: async (issueKey, accountId) => {
    const snapshot = [...get().issues];
    const user = get().assignableUsers.find((u) => u.accountId === accountId);
    if (user) get().optimisticAssign(issueKey, user);

    set((s) => ({
      loading: { ...s.loading, assign: true },
      errors: { ...s.errors, action: null },
    }));
    try {
      await forgeApi.assignIssue(issueKey, accountId);
      await get().refreshIssues();
      await get().loadTeam();
    } catch (e) {
      get().rollbackIssues(snapshot);
      set((s) => ({
        errors: {
          ...s.errors,
          action: e instanceof Error ? e.message : "Assign failed",
        },
      }));
      throw e;
    } finally {
      set((s) => ({ loading: { ...s.loading, assign: false } }));
    }
  },

  updatePriority: async (issueKey, priorityName) => {
    const snapshot = [...get().issues];
    get().optimisticPriority(issueKey, priorityName);

    set((s) => ({
      loading: { ...s.loading, priority: true },
      errors: { ...s.errors, action: null },
    }));
    try {
      await forgeApi.updatePriority(issueKey, priorityName);
      await get().refreshIssues();
    } catch (e) {
      get().rollbackIssues(snapshot);
      set((s) => ({
        errors: {
          ...s.errors,
          action: e instanceof Error ? e.message : "Priority update failed",
        },
      }));
      throw e;
    } finally {
      set((s) => ({ loading: { ...s.loading, priority: false } }));
    }
  },

  autoAssignUnassigned: async () => {
    const key = get().selectedProjectKey;
    if (!key) throw new Error("No project selected");
    const snapshot = [...get().issues];

    set((s) => ({
      loading: { ...s.loading, autoAssign: true },
      errors: { ...s.errors, action: null },
    }));
    try {
      const result = await forgeApi.autoAssignUnassigned(key);
      get().optimisticAutoAssign(result);
      await get().refreshIssues();
      await get().loadTeam();
      return result;
    } catch (e) {
      get().rollbackIssues(snapshot);
      set((s) => ({
        errors: {
          ...s.errors,
          action: e instanceof Error ? e.message : "Auto-assign failed",
        },
      }));
      throw e;
    } finally {
      set((s) => ({ loading: { ...s.loading, autoAssign: false } }));
    }
  },

  clearActionError: () =>
    set((s) => ({ errors: { ...s.errors, action: null } })),
}));
