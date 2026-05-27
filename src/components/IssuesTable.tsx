import BuildIcon from "@mui/icons-material/Build";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { IssueView } from "../shared/types";
import { useAppStore } from "../store/useAppStore";
import { AssigneeFixModal } from "./AssigneeFixModal";
import { PriorityFixModal } from "./PriorityFixModal";
import { view } from "@forge/bridge";
import { ROWS_PER_PAGE } from "../shared/constants";

export function IssuesTable() {
  const { issues, loading, errors } = useAppStore();
  const [page, setPage] = useState(0);
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    key: string | null;
  }>({
    open: false,
    key: null,
  });
  const [priorityModal, setPriorityModal] = useState<{
    open: boolean;
    issue: IssueView | null;
  }>({ open: false, issue: null });

  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    view.getContext().then((ctx) => {
      setSiteUrl(ctx.siteUrl);
    });
  }, []);

  const handleFix = (issue: IssueView) => {
    if (issue.problemType === "unassigned") {
      setAssignModal({ open: true, key: issue.key });
    } else if (issue.problemType === "low_priority_deadline") {
      setPriorityModal({ open: true, issue });
    }
  };

  const rowsPerPage = ROWS_PER_PAGE;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(issues.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [issues.length, page]);

  const pagedIssues = issues.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  if (loading.issues && issues.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {errors.issues && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.issues}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              <TableCell>Key</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedIssues.map((issue) => (
              <TableRow
                key={issue.key}
                className={
                  issue.problemType === "unassigned"
                    ? "problem-unassigned"
                    : issue.problemType === "low_priority_deadline"
                      ? "problem-deadline"
                      : ""
                }
              >
                <TableCell>
                  {issue.problemType === "unassigned" && (
                    <Tooltip title="No assignee">
                      <span role="img" aria-label="unassigned">
                        🔴
                      </span>
                    </Tooltip>
                  )}
                  {issue.problemType === "low_priority_deadline" && (
                    <Tooltip title="Low priority with close deadline">
                      <span role="img" aria-label="deadline risk">
                        🟡
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`${siteUrl}/browse/${issue.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="body2"
                    fontWeight={600}
                  >
                    {issue.key}
                  </Link>
                </TableCell>
                <TableCell>{issue.fields.summary}</TableCell>
                <TableCell>
                  <Chip
                    label={issue.fields.status?.name ?? "—"}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {issue.fields.assignee ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={issue.fields.assignee.avatarUrls?.["24x24"]}
                        alt={issue.fields.assignee.displayName}
                        sx={{ width: 24, height: 24 }}
                      >
                        {issue.fields.assignee.displayName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {issue.fields.assignee.displayName}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="error">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{issue.fields.priority?.name ?? "—"}</TableCell>
                <TableCell align="right">
                  {issue.problemType && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BuildIcon />}
                      onClick={() => handleFix(issue)}
                    >
                      Fix
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {issues.length === 0 && !loading.issues && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>
                    No issues in this project
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={issues.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </TableContainer>

      <AssigneeFixModal
        open={assignModal.open}
        issueKey={assignModal.key}
        onClose={() => setAssignModal({ open: false, key: null })}
      />

      <PriorityFixModal
        open={priorityModal.open}
        issueKey={priorityModal.issue?.key ?? null}
        currentPriority={priorityModal.issue?.fields.priority?.name}
        dueDate={priorityModal.issue?.fields.duedate}
        onClose={() => setPriorityModal({ open: false, issue: null })}
      />
    </>
  );
}
