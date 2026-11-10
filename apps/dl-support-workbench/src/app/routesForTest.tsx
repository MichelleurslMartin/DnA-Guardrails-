import { Route, Routes } from 'react-router-dom';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { ActionsPage } from '../features/ActionsPage';
import { DashboardPage } from '../features/DashboardPage';
import { EngagementsPage } from '../features/EngagementsPage';
import { LifecyclePage } from '../features/LifecyclePage';

export function AppRoutes() {
  return (
    <WorkbenchShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/lifecycle" element={<LifecyclePage />} />
        <Route path="/engagements" element={<EngagementsPage />} />
        <Route path="/actions" element={<ActionsPage />} />
      </Routes>
    </WorkbenchShell>
  );
}