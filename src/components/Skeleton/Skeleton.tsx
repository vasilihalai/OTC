import './Skeleton.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export function Skeleton({ width = '100%', height = 16, radius = 8 }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}
