export const STATUS_LABELS = {
  pending:         'Pending',
  confirmed:       'Confirmed',
  open_for_agents: 'Open for Agents',
  assigned:        'Assigned',
  accepted:        'Accepted',
  in_progress:     'In Progress',
  completed:       'Completed',
  closed:          'Closed',
  cancelled:       'Cancelled',
  rejected:        'Rejected',
};

export function humanizeStatus(status) {
  return STATUS_LABELS[status] ?? String(status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
