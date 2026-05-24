import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useState } from "react";
import { DEADLINE_THRESHOLD_DAYS } from "../backend/issueUtils";
import { useAppStore } from "../store/useAppStore";

interface PriorityFixModalProps {
  open: boolean;
  issueKey: string | null;
  currentPriority?: string | null;
  dueDate?: string | null;
  onClose: () => void;
}

export function PriorityFixModal({
  open,
  issueKey,
  currentPriority,
  dueDate,
  onClose,
}: PriorityFixModalProps) {
  const { updatePriority, loading } = useAppStore();
  const [priority, setPriority] = useState<"Medium" | "High">("Medium");

  const handleSave = async () => {
    if (!issueKey) return;
    try {
      await updatePriority(issueKey, priority);
      onClose();
    } catch {
      console.log("Save error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Raise priority — {issueKey}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Issue has ({currentPriority ?? "Low"}) priority and deadline within{" "}
          {DEADLINE_THRESHOLD_DAYS} days ({dueDate ?? "soon"}). Suggested fix:
        </DialogContentText>
        <FormControl>
          <RadioGroup
            value={priority}
            onChange={(e) => setPriority(e.target.value as "Medium" | "High")}
          >
            <FormControlLabel
              value="Medium"
              control={<Radio />}
              label="Medium"
            />
            <FormControlLabel value="High" control={<Radio />} label="High" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading.priority}
          startIcon={
            loading.priority ? <CircularProgress size={16} /> : undefined
          }
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}
