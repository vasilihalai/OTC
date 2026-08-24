import type { ChangeEvent, ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './AmountField.css';

const [b, e] = bem('amount-field');

function TransferGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 0 1 12.7-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17.2 3.2v3.9h-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.5 12a7.5 7.5 0 0 1-12.7 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6.8 20.8v-3.9h3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface AmountFieldProps {
  label: string;
  availableLabel: string;
  available: string;
  value: string;
  onChange: (value: string) => void;
  onMax: () => void;
  maxLabel: string;
  error?: string;
  onTransfer?: () => void;
  assetSelect?: ReactNode;
}

export function AmountField({
  label,
  availableLabel,
  available,
  value,
  onChange,
  onMax,
  maxLabel,
  error,
  onTransfer,
  assetSelect,
}: AmountFieldProps) {
  function handleChange(ev: ChangeEvent<HTMLInputElement>) {
    onChange(ev.target.value);
  }

  return (
    <div className={b({ invalid: !!error })}>
      <div className={e('header')}>
        <span className={e('label')}>{label}</span>
        <span className={e('available')}>
          {availableLabel}: {available}
          {onTransfer && (
            <button type="button" className={e('transfer')} aria-label="Transfer" onClick={onTransfer}>
              <TransferGlyph/>
            </button>
          )}
        </span>
      </div>
      <div className={e('box')}>
        {assetSelect && <div className={e('asset')}>{assetSelect}</div>}
        <input
          className={e('input')}
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={handleChange}
        />
        <button type="button" className={e('max')} onClick={onMax}>{maxLabel}</button>
      </div>
      {error && <span className={e('error')}>{error}</span>}
    </div>
  );
}
