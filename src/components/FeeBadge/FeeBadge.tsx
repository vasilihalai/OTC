import './FeeBadge.css';

export function FeeBadge({ children }: { children: string }) {
  return <span className="fee-badge">{children}</span>;
}
