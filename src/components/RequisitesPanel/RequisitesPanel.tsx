import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { bem } from '@/css/bem.ts';
import { useCopy } from '@/lib/useCopy.ts';
import type { CryptoRequisites, FiatRequisites } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

import './RequisitesPanel.css';

const [, e] = bem('requisites-panel');

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5.5 13.5H12a1.5 1.5 0 0 0 1.5-1.5V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function NetworkTrailingIcons() {
  return (
    <>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </>
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
      <Panel fill="surface" radius="16px">
        <h2 className={e('heading')}>{ru.dealDetail.requisitesTitle}</h2>
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
    void QRCode.toDataURL(requisites.address, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: 'H',
      color: { dark: '#0D0E10', light: '#FFFFFF' },
    })
      .then((url) => { if (!cancelled) setQr(url); });
    return () => { cancelled = true; };
  }, [requisites.address]);

  return (
    <Panel fill="surface" radius="16px">
      <h2 className={e('heading')}>{ru.dealDetail.requisitesTitle}</h2>
      <div className={e('select')}>
        <Select
          label={ru.dealDetail.requisitesAssetLabel}
          layout="asset"
          options={[{
            value: requisites.asset,
            label: requisites.asset,
            secondary: requisites.assetName,
            icon: <CurrencyIcon ticker={requisites.asset} size={24}/>,
          }]}
          value={requisites.asset}
          onChange={() => {}}
        />
      </div>
      <div className={e('select', 'network')}>
        <Select
          label={ru.dealDetail.requisitesNetworkLabel}
          layout="plain"
          options={[{ value: requisites.network, label: requisites.network }]}
          value={requisites.network}
          onChange={() => {}}
          trailingIcon={<NetworkTrailingIcons/>}
        />
      </div>
      <p className={e('qr-caption')}>{ru.dealDetail.requisitesScanQr}</p>
      <div className={e('qr-plate')}>
        {qr && <img src={qr} width={160} height={160} alt=""/>}
        <span className={e('qr-mark')} aria-hidden="true">X</span>
      </div>
      <p className={e('qr-caption', 'divider')}>{ru.dealDetail.requisitesOrCopy}</p>
      <div className={e('address-row')}>
        <span className={e('address-text')}>{requisites.address}</span>
        <button type="button" className={e('copy')} aria-label={ru.common.copyAction} onClick={() => copy(requisites.address)}>
          <CopyIcon/>
        </button>
      </div>
    </Panel>
  );
}
