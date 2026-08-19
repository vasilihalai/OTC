import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { bem } from '@/css/bem.ts';
import { useCopy } from '@/lib/useCopy.ts';
import { truncateMiddle } from '@/lib/text.ts';
import type { CryptoRequisites, FiatRequisites } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

import './RequisitesPanel.css';

const [, e] = bem('requisites-panel');

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function FiatRow({ label, value, copy }: { label: string; value: string; copy: () => void }) {
  return (
    <div className={e('row')}>
      <span className={e('row-label')}>{label}</span>
      <span className={e('row-value')}>
        <span className={e('row-value-text')}>{value}</span>
        <button type="button" className={e('copy')} aria-label={ru.common.copyAction} onClick={copy}>
          <CopyIcon/>
        </button>
      </span>
    </div>
  );
}

export function RequisitesPanel({ requisites }: { requisites: FiatRequisites | CryptoRequisites }) {
  const copy = useCopy();

  if (requisites.kind === 'fiat') {
    const rows: [string, string][] = [
      [ru.dealDetail.requisitesCompanyName, requisites.companyName],
      [ru.dealDetail.requisitesBank, requisites.bank],
      [ru.dealDetail.requisitesBankAddress, requisites.bankAddress],
      [ru.dealDetail.requisitesBik, requisites.bik],
      [ru.dealDetail.requisitesAccount, requisites.account],
      [ru.dealDetail.requisitesRecipient, requisites.recipient],
      [ru.dealDetail.requisitesRecipientAddress, requisites.recipientAddress],
      [ru.dealDetail.requisitesCorrAccount, requisites.corrAccount],
      [ru.dealDetail.requisitesPurpose, requisites.purpose],
    ];
    const allText = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

    return (
      <Panel heading={ru.dealDetail.requisitesTitle}>
        {rows.map(([label, value]) => (
          <FiatRow key={label} label={label} value={value} copy={() => copy(value)}/>
        ))}
        <button type="button" className={e('copy-all')} onClick={() => copy(allText)}>
          {ru.dealDetail.requisitesCopyAll}
        </button>
      </Panel>
    );
  }

  return <CryptoRequisitesBody requisites={requisites}/>;
}

function CryptoRequisitesBody({ requisites }: { requisites: CryptoRequisites }) {
  const copy = useCopy();
  const [qr, setQr] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(requisites.address, { margin: 1, width: 160, color: { dark: '#0D0E10', light: '#FFFFFF' } })
      .then((url) => { if (!cancelled) setQr(url); });
    return () => { cancelled = true; };
  }, [requisites.address]);

  return (
    <Panel heading={ru.dealDetail.requisitesTitle}>
      <Select
        label={ru.dealDetail.requisitesAssetLabel}
        options={[{ value: requisites.asset, label: requisites.assetName }]}
        value={requisites.asset}
        readOnly
        renderValue={() => (
          <span className={e('asset-value')}>
            <span className={e('asset-left')}>
              <CurrencyIcon ticker={requisites.asset} size={24}/>
              {requisites.asset}
            </span>
            <span className={e('asset-name')}>{requisites.assetName}</span>
          </span>
        )}
      />
      <Select
        label={ru.dealDetail.requisitesNetworkLabel}
        options={[{ value: requisites.network, label: requisites.network }]}
        value={requisites.network}
        readOnly
        showClear
      />
      <p className={e('qr-caption')}>{ru.dealDetail.requisitesScanQr}</p>
      <div className={e('qr-plate')}>
        {qr && <img src={qr} width={160} height={160} alt=""/>}
      </div>
      <p className={e('qr-caption')}>{ru.dealDetail.requisitesOrCopy}</p>
      <div className={e('address-row')}>
        <span className={e('address-text')}>{truncateMiddle(requisites.address, 10, 8)}</span>
        <button type="button" className={e('copy')} aria-label={ru.common.copyAction} onClick={() => copy(requisites.address)}>
          <CopyIcon/>
        </button>
      </div>
    </Panel>
  );
}
