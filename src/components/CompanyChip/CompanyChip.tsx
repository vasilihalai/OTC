import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';

export function CompanyChip({ children }: { children: string }) {
  return <StatusChip tone="success">{children}</StatusChip>;
}
