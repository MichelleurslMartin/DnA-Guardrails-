import {
  Badge,
  Button,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import { EditRegular } from './icons';
import type { WorkItem, WorkItemStatus } from '../api/types';

interface WorkItemTableProps {
  items: WorkItem[];
  onEdit: (item: WorkItem) => void;
  onStatusChange: (item: WorkItem, status: WorkItemStatus) => void;
}

const statusLabels: Record<WorkItemStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  complete: 'Complete',
};

function statusColor(status: WorkItemStatus): 'subtle' | 'informative' | 'warning' | 'success' | 'danger' {
  if (status === 'complete') return 'success';
  if (status === 'blocked') return 'danger';
  if (status === 'in-progress') return 'informative';
  return 'subtle';
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function WorkItemTable({ items, onEdit, onStatusChange }: WorkItemTableProps) {
  return (
    <div className="table-scroll">
      <Table size="small" aria-label="Work items">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Work item</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <TableHeaderCell>Due date</TableHeaderCell>
            <TableHeaderCell>Evidence</TableHeaderCell>
            <TableHeaderCell>Source</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell><span className="visually-hidden">Edit</span></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="item-cell">
                  <strong>{item.title}</strong>
                  <span>{item.stage || item.category}</span>
                </div>
              </TableCell>
              <TableCell>{item.owner || 'Unassigned'}</TableCell>
              <TableCell>{item.dueDate || 'Not set'}</TableCell>
              <TableCell>{item.evidence || 'Not set'}</TableCell>
              <TableCell>
                <div className="source-cell">
                  <span>{item.sourceTool || 'Not set'}</span>
                  {safeHttpUrl(item.sourceUrl)
                    ? <a href={safeHttpUrl(item.sourceUrl) ?? undefined} target="_blank" rel="noreferrer">Open {item.sourceTool || 'source'}</a>
                    : <span>{item.sourceUrl ? 'Invalid link' : 'No link'}</span>}
                </div>
              </TableCell>
              <TableCell>
                <div className="status-cell">
                  <Badge appearance="tint" color={statusColor(item.status)}>{statusLabels[item.status]}</Badge>
                  <Select
                    aria-label={`Status for ${item.title}`}
                    value={item.status}
                    onChange={(_, data) => onStatusChange(item, data.value as WorkItemStatus)}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  appearance="subtle"
                  icon={<EditRegular />}
                  aria-label={`Edit ${item.title}`}
                  onClick={() => onEdit(item)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}