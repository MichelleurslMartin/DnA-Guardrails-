import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { ActionsPage } from '../features/ActionsPage';
import { DashboardPage } from '../features/DashboardPage';
import { EngagementsPage } from '../features/EngagementsPage';
import { LifecyclePage } from '../features/LifecyclePage';
import { WorkbenchProvider } from './WorkbenchContext';
import { Button, Card, Title2 } from '@fluentui/react-components';

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Card className="not-found">
      <Title2 as="h1">Page not found</Title2>
      <Button appearance="primary" onClick={() => navigate('/')}>Return to delivery workbench</Button>
    </Card>
  );
}

function RouteContent() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="route-frame"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lifecycle" element={<LifecyclePage />} />
          <Route path="/engagements" element={<EngagementsPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <WorkbenchProvider>
      <BrowserRouter>
        <WorkbenchShell>
          <RouteContent />
        </WorkbenchShell>
      </BrowserRouter>
    </WorkbenchProvider>
  );
}