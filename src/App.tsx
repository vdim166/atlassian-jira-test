import { Box, Container, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { IssuesTable } from "./components/IssuesTable";
import { TeamTab } from "./components/TeamTab";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const [tab, setTab] = useState(0);
  const loadProjects = useAppStore((state) => state.loadProjects);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 2 }}>
      <Container maxWidth="xl">
        <ControlPanel />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Issues" />
          <Tab label="Team" />
        </Tabs>

        {tab === 0 && <IssuesTable />}
        {tab === 1 && <TeamTab />}
      </Container>
    </Box>
  );
}
