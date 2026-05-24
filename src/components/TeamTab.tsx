import GroupIcon from '@mui/icons-material/Group';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { TeamMemberStats } from '../shared/types';
import { useAppStore } from '../store/useAppStore';

const ACTIVITY_COLOR: Record<TeamMemberStats['activityLabel'], 'success' | 'warning' | 'default'> = {
  high: 'success',
  medium: 'warning',
  low: 'default',
};

export function TeamTab() {
  const { teamMembers, loading, errors } = useAppStore();

  if (loading.team && teamMembers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <GroupIcon color="primary" />
        <Typography variant="h6">Team members</Typography>
      </Stack>

      {errors.team && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.team}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell align="center">Assigned tasks</TableCell>
              <TableCell>Activity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.user.accountId}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {member.user.displayName.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{member.user.displayName}</Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Chip label={member.assignedCount} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Stack spacing={0.5}>
                    <Chip
                      label={member.activityLabel}
                      size="small"
                      color={ACTIVITY_COLOR[member.activityLabel]}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, member.activityScore)}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {teamMembers.length === 0 && !loading.team && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary" py={3}>
                    No team data
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
