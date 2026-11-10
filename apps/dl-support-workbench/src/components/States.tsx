import {
  Button,
  Body1,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Skeleton,
  SkeletonItem,
  Title3,
} from '@fluentui/react-components';
import { ArrowClockwiseRegular, BoxRegular } from './icons';
import type { WorkbenchLoadState } from '../api/types';

interface DataStateProps {
  state: WorkbenchLoadState;
  error: string | null;
  onRetry: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText: string;
  emptyAction?: { label: string; onClick: () => void };
  children: React.ReactNode;
}

export function DataState({ state, error, onRetry, isEmpty, emptyTitle, emptyText, emptyAction, children }: DataStateProps) {
  if (state === 'loading') {
    return (
      <Card className="state-panel" aria-label="Loading workbench">
        <Skeleton aria-hidden="true">
          <SkeletonItem size={24} />
          <SkeletonItem className="skeleton-line" />
          <SkeletonItem className="skeleton-line" />
        </Skeleton>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <div className="state-error">
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Workbench unavailable</MessageBarTitle>
            {error ?? 'The workbench API could not be reached.'}
          </MessageBarBody>
        </MessageBar>
        <Button icon={<ArrowClockwiseRegular />} onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Card className="empty-state" appearance="outline">
        <BoxRegular className="empty-state-icon" aria-hidden="true" />
        <Title3>{emptyTitle}</Title3>
        <Body1>{emptyText}</Body1>
        {emptyAction && <Button appearance="primary" onClick={emptyAction.onClick}>{emptyAction.label}</Button>}
      </Card>
    );
  }

  return <>{children}</>;
}

export function WorkbenchNotice() {
  return (
    <MessageBar intent="info" className="local-notice">
      <MessageBarBody>
        <MessageBarTitle>Local workbench API</MessageBarTitle>
        Work items, engagement details, and theme preferences are stored by the local API. No sign-in, external platform checks, workflow calls, or connected agent service are active.
      </MessageBarBody>
    </MessageBar>
  );
}