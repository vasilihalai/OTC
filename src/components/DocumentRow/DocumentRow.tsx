import { bem } from '@/css/bem.ts';

import './DocumentRow.css';

const [b, e] = bem('document-row');

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v8m0 0l-3-3m3 3l3-3M2.5 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface DocumentRowProps {
  name: string;
  enabled: boolean;
  caption?: string;
  onOpen: () => void;
}

export function DocumentRow({ name, enabled, caption, onOpen }: DocumentRowProps) {
  return (
    <div className={b({ disabled: !enabled })}>
      <button
        type="button"
        className={e('main')}
        disabled={!enabled}
        onClick={enabled ? onOpen : undefined}
      >
        <DownloadIcon/>
        <span className={e('name')}>{name}</span>
      </button>
      {!enabled && caption && <span className={e('caption')}>{caption}</span>}
    </div>
  );
}
