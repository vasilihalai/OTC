import type { PropsWithChildren } from 'react';

import './Card.css';

export function Card({ children }: PropsWithChildren) {
  return <div className="card">{children}</div>;
}
