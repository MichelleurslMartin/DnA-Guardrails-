import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FluentProvider,
  Select,
  Tab,
  TabList,
  Text,
  Toolbar,
} from '@fluentui/react-components';
import {
  ClipboardTaskRegular,
  DataBarVerticalRegular,
  HomeRegular,
  ShieldTaskRegular,
} from './icons';
import { appThemes } from '../app/theme';
import { useWorkbench } from '../app/WorkbenchContext';
import type { ThemePreference } from '../api/types';
import styles from '../styles/App.module.css';
import { WorkbenchNotice } from './States';

const routes = [
  { path: '/', label: 'Delivery Workbench', icon: <HomeRegular /> },
  { path: '/lifecycle', label: 'Lifecycle Playbook', icon: <DataBarVerticalRegular /> },
  { path: '/engagements', label: 'Engagement Checks', icon: <ShieldTaskRegular /> },
  { path: '/actions', label: 'Actions & Decisions', icon: <ClipboardTaskRegular /> },
];

function isThemePreference(value: string): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function WorkbenchShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, savePreferences } = useWorkbench();
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const widthQuery = window.matchMedia('(max-width: 760px)');
    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateWidth = () => setCompact(widthQuery.matches);
    const updateTheme = () => setSystemDark(themeQuery.matches);
    widthQuery.addEventListener('change', updateWidth);
    themeQuery.addEventListener('change', updateTheme);
    return () => {
      widthQuery.removeEventListener('change', updateWidth);
      themeQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  const resolvedTheme = preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme;

  return (
    <FluentProvider theme={appThemes[resolvedTheme]}>
      <div className={styles.appRoot} data-theme={resolvedTheme}>
        <header className="app-header">
          <Toolbar aria-label="Workbench header" className="header-toolbar">
            <div className="brand-lockup"><Text weight="bold" className="brand-name">Avanade</Text><span aria-hidden="true">/</span><Text>DL Support Workbench</Text></div>
            <div className="header-controls">
              <Text size={200} className="local-badge">Local API workspace</Text>
              <label className="theme-control" htmlFor="theme-select">Theme</label>
              <Select
                id="theme-select"
                aria-label="Theme"
                value={preferences.theme}
                onChange={(_, data) => {
                  if (isThemePreference(data.value)) void savePreferences({ theme: data.value });
                }}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
          </Toolbar>
        </header>
        <WorkbenchNotice />
        <div className="app-layout">
          <nav className="app-nav" aria-label="Workbench navigation">
            <Text size={100} weight="semibold" className="nav-label">WORKBENCH</Text>
            <TabList
              vertical={!compact}
              selectedValue={location.pathname}
              onTabSelect={(_, data) => navigate(String(data.value))}
              aria-label="Workbench pages"
            >
              {routes.map((route) => (
                <Tab key={route.path} value={route.path} icon={route.icon}>
                  {route.label}
                </Tab>
              ))}
            </TabList>
          </nav>
          <main className="app-main">{children}</main>
        </div>
      </div>
    </FluentProvider>
  );
}