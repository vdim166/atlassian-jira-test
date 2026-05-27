import {
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

interface AssigneeFixModalProps {
  open: boolean;
  issueKey: string | null;
  onClose: () => void;
}

export function AssigneeFixModal({
  open,
  issueKey,
  onClose,
}: AssigneeFixModalProps) {
  const { assignableUsers, loadAssignableUsers, assignIssue, loading } =
    useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadAssignableUsers();
      setSelectedId(null);
    }
  }, [open, loadAssignableUsers]);

  const handleAssign = async () => {
    if (!issueKey || !selectedId) return;
    try {
      await assignIssue(issueKey, selectedId);
      onClose();
    } catch {
      console.log("Assign error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign {issueKey}</DialogTitle>
      <DialogContent dividers>
        <List disablePadding>
          {assignableUsers.map((user) => (
            <ListItemButton
              key={user.accountId}
              selected={selectedId === user.accountId}
              onClick={() => setSelectedId(user.accountId)}
            >
              <ListItemAvatar>
                <Avatar
                  src={user.avatarUrls?.["24x24"]}
                  alt={user.displayName}
                  sx={{ width: 32, height: 32 }}
                >
                  {user.displayName.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.displayName} />
            </ListItemButton>
          ))}
          {assignableUsers.length === 0 && (
            <ListItemText
              primary="No assignable users found"
              sx={{ py: 1, textAlign: "center" }}
            />
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedId || loading.assign}
          onClick={handleAssign}
          startIcon={
            loading.assign ? <CircularProgress size={16} /> : undefined
          }
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
