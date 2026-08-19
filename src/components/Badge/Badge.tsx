import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';

export function Badge({ children }: { children: string }) {
  return <StatusChip tone="badge">{children}</StatusChip>;
}
