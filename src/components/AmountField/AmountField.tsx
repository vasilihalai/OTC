import type { ChangeEvent, ReactNode } from 'react';

import { bem } from '@/css/bem.ts';

import './AmountField.css';

const [b, e] = bem('amount-field');

function TransferGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 8h10m0 0l-3.5-3.5M17 8l-3.5 3.5M17 16H7m0 0l3.5-3.5M7 16l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
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
  /** Fill `--bg-raised` instead of `--bg-page` — used only inside the transfer modal. */
  transferVariant?: boolean;
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
  transferVariant,
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
      <div className={e('box', { transfer: !!transferVariant })}>
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
