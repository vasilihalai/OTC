import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { bem } from '@/css/bem.ts';
import { truncateMiddle } from '@/lib/text.ts';
import { FeeBadge } from '@/components/FeeBadge/FeeBadge.tsx';
import { ru } from '@/i18n/ru.ts';

import './Select.css';

const [b, e] = bem('select');

export type SelectLayout = 'asset' | 'method' | 'address' | 'plain';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** `asset` layout: full name on the right. `method` layout: fee text, e.g. `1.0%`. */
  secondary?: string;
  /** `address` layout only: wallet labels shown as a second metadata line, e.g. `Trust Wallet, MetaMask +2`. */
  labels?: string[];
  icon?: ReactNode;
  disabled?: boolean;
}

/** `["Trust Wallet", "MetaMask", "Ledger"]` → `Метки: Trust Wallet, MetaMask +1`. */
function formatLabelsLine(labels: string[]): string {
  const shown = labels.slice(0, 2).join(', ');
  const rest = labels.length - 2;
  return rest > 0 ? `${ru.withdraw.addressLabelsPrefix} ${shown} +${rest}` : `${ru.withdraw.addressLabelsPrefix} ${shown}`;
}

export interface SelectProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layout?: SelectLayout;
  /** Shown instead of the box when `options` is empty. */
  emptyState?: ReactNode;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0, transition: 'transform 0.15s ease' }}
    >
      <path d="M1 1.5L6 6.5L11 1.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Row<T extends string>({ option, layout }: { option: SelectOption<T>; layout: SelectLayout }) {
  if (layout === 'asset') {
    return (
      <span className={e('row', 'asset')}>
        <span className={e('row-left')}>
          {option.icon}
          <span className={e('row-ticker')}>{option.label}</span>
        </span>
        {option.secondary && <span className={e('row-secondary')}>{option.secondary}</span>}
      </span>
    );
  }
  if (layout === 'method') {
    return (
      <span className={e('row', 'method')}>
        <span className={e('row-left')}>
          {option.icon}
          <span className={e('row-name')}>{option.label}</span>
          {option.secondary && <FeeBadge>{option.secondary}</FeeBadge>}
        </span>
      </span>
    );
  }
  if (layout === 'address') {
    return (
      <span className={e('row', 'address')}>
        <span className={e('row-address')}>{truncateMiddle(option.label, 8, 6)}</span>
        {option.labels && option.labels.length > 0 && (
          <span className={e('row-meta')}>{formatLabelsLine(option.labels)}</span>
        )}
      </span>
    );
  }
  return <span className={e('row-plain')}>{option.label}</span>;
}

export function Select<T extends string>({ label, options, value, onChange, layout = 'plain', emptyState }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const readOnly = options.length <= 1;

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(ev: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={b()} ref={rootRef}>
      <span className={e('label')}>{label}</span>
      {options.length === 0 && emptyState ? (
        emptyState
      ) : (
        <div className={e('wrap')}>
          <button
            type="button"
            className={e('box', { readonly: readOnly, open })}
            disabled={readOnly}
            onClick={() => setOpen((v) => !v)}
          >
            {selected ? <Row option={selected} layout={layout}/> : <span className={e('row-plain')}>—</span>}
            {!readOnly && <ChevronIcon open={open}/>}
          </button>

          {open && !readOnly && (
            <div className={e('dropdown')}>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={e('option', { disabled: !!option.disabled })}
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Row option={option} layout={layout}/>
                  {option.value === value && <CheckIcon/>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
