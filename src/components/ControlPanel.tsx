import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { ConfirmDialog } from "./ConfirmDialog";

export function ControlPanel() {
  const {
    projects,
    selectedProjectKey,
    stats,
    loading,
    errors,
    selectProject,
    autoAssignUnassigned,
    clearActionError,
  } = useAppStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [autoAssignMessage, setAutoAssignMessage] = useState<string | null>(
    null,
  );

  const handleAutoAssign = async () => {
    setConfirmOpen(false);
    clearActionError();
    try {
      const result = await autoAssignUnassigned();
      setAutoAssignMessage(
        `Assigned ${result.assigned.length} issue(s)` +
          (result.failed.length ? `, ${result.failed.length} failed` : ""),
      );
    } catch {
      console.log("Assign error");
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Jira Project Assistant
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="project-select-label">Project</InputLabel>
            <Select
              labelId="project-select-label"
              label="Project"
              value={selectedProjectKey ?? ""}
              onChange={(e) => selectProject(e.target.value)}
              disabled={loading.projects}
            >
              {projects.map((p) => (
                <MenuItem key={p.key} value={p.key}>
                  {p.name} ({p.key})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {errors.projects && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.projects}
          </Alert>
        )}

        {stats && (
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <StatCard
              icon={<AssignmentIcon color="primary" />}
              label="Total issues"
              value={stats.total}
            />
            <StatCard
              icon={<ErrorOutlineIcon color="error" />}
              label="Unassigned"
              value={stats.unassigned}
            />
            <StatCard
              icon={<WarningAmberIcon color="warning" />}
              label="Low priority + deadline"
              value={stats.lowPriorityDeadline}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              height="100%"
            >
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  loading.autoAssign ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AutoFixHighIcon />
                  )
                }
                disabled={loading.autoAssign || stats.unassigned === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Auto-assign unassigned
              </Button>
            </Stack>
          </Box>
        )}

        {errors.action && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={clearActionError}>
            {errors.action}
          </Alert>
        )}

        {autoAssignMessage && (
          <Alert
            severity="success"
            sx={{ mt: 2 }}
            onClose={() => setAutoAssignMessage(null)}
          >
            {autoAssignMessage}
          </Alert>
        )}

        <ConfirmDialog
          open={confirmOpen}
          title="Auto-assign unassigned issues?"
          message={`This will randomly assign ${stats?.unassigned ?? 0} unassigned issue(s) to active project members.`}
          confirmLabel="Assign all"
          onConfirm={handleAutoAssign}
          onCancel={() => setConfirmOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Box>
          <Typography variant="h6">{value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
