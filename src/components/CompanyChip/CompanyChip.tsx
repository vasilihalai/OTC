import { Badge } from '@/components/Badge/Badge.tsx';

export function CompanyChip({ children }: { children: string }) {
  return <Badge variant="success">{children}</Badge>;
}
