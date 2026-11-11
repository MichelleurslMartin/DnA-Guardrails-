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
import { DeleteRegular, EditRegular } from './icons';
import type { WorkItem, WorkItemStatus } from '../api/types';

interface WorkItemTableProps {
  items: WorkItem[];
  onEdit: (item: WorkItem) => void;
  onStatusChange: (item: WorkItem, status: WorkItemStatus) => void;
  onDelete?: (item: WorkItem) => void;
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

export function WorkItemTable({ items, onEdit, onStatusChange, onDelete }: WorkItemTableProps) {
  return (
    <div className="table-scroll">
      <Table size="small" aria-label="Work items">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Work item</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <TableHeaderCell>Due date</TableHeaderCell>
            <TableHeaderCell>Evidence</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell><span className="visually-hidden">Work item actions</span></TableHeaderCell>
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
                <div className="table-actions">
                  <Button
                    appearance="subtle"
                    icon={<EditRegular />}
                    aria-label={`Edit ${item.title}`}
                    title="Edit work item"
                    onClick={() => onEdit(item)}
                  />
                  {onDelete && (
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label={`Delete local follow-up ${item.title}`}
                      title="Delete optional local follow-up"
                      onClick={() => {
                        if (window.confirm(`Delete the local follow-up “${item.title}”? This cannot be undone.`)) onDelete(item);
                      }}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}