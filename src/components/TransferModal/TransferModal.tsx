import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal/Modal.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { AmountField } from '@/components/AmountField/AmountField.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { getAccounts, getAssets, transfer } from '@/api/index.ts';
import type { Accounts, Asset, TransferAccount } from '@/api/index.ts';
import { useTransferModalStore } from '@/store/transferModal.ts';
import { useUiStore } from '@/store/ui.ts';
import { useToastStore } from '@/store/toast.ts';
import { notifySuccess } from '@/telegram/adapter.ts';
import { formatAmount } from '@/lib/money.ts';
import { ru } from '@/i18n/ru.ts';

import './TransferModal.css';

function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 6h9m0 0l-2.5-2.5M12 6L9.5 8.5M13 10H4m0 0l2.5-2.5M4 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const ACCOUNT_OPTIONS = [
  { value: 'trading' as TransferAccount, label: ru.transferModal.accountTrading },
  { value: 'deposit' as TransferAccount, label: ru.transferModal.accountDeposit },
];

export function TransferModal() {
  const isOpen = useTransferModalStore((s) => s.isOpen);
  const close = useTransferModalStore((s) => s.close);
  const bumpBalancesVersion = useUiStore((s) => s.bumpBalancesVersion);
  const showToast = useToastStore((s) => s.show);

  const [from, setFrom] = useState<TransferAccount>('trading');
  const [to, setTo] = useState<TransferAccount>('deposit');
  const [ticker, setTicker] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState<Accounts>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setAmount('');
    void Promise.all([getAccounts(), getAssets('fiat'), getAssets('crypto')]).then(([accountsData, fiat, crypto]) => {
      setAccounts(accountsData);
      setAssets([...fiat, ...crypto]);
    });
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const available = accounts ? (accounts[from][ticker] ?? '0') : '0';
  const availableLabel = `${formatAmount(available, ticker)} ${ticker}`;
  const amountNum = Number(amount || '0');
  const canConfirm = amountNum > 0 && amountNum <= Number(available);

  function handleSwap() {
    const prevFrom = from;
    setFrom(to);
    setTo(prevFrom);
  }

  function selectFrom(value: TransferAccount) {
    if (value === to) {
      setTo(from);
    }
    setFrom(value);
  }

  function selectTo(value: TransferAccount) {
    if (value === from) {
      setFrom(to);
    }
    setTo(value);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await transfer({ from, to, ticker, amount });
      notifySuccess();
      bumpBalancesVersion();
      showToast(ru.transferModal.successToast);
      close();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={isOpen}
      title={ru.transferModal.title}
      onClose={close}
      footer={(
        <div className="button-row">
          <Button type="button" variant="secondary" onClick={close}>{ru.transferModal.cancelAction}</Button>
          <Button loading={submitting} disabled={!canConfirm} onClick={() => void handleConfirm()}>
            {ru.transferModal.confirmAction}
          </Button>
        </div>
      )}
    >
      <div className="transfer-modal">
        <div className="transfer-modal__accounts">
          <Select label={ru.transferModal.fromLabel} layout="plain" options={ACCOUNT_OPTIONS} value={from} onChange={selectFrom}/>
          <button type="button" className="transfer-modal__swap" aria-label="Swap" onClick={handleSwap}>
            <SwapIcon/>
          </button>
          <Select label={ru.transferModal.toLabel} layout="plain" options={ACCOUNT_OPTIONS} value={to} onChange={selectTo}/>
        </div>

        <AmountField
          label={ru.transferModal.amountLabel}
          availableLabel={ru.transferModal.availableLabel}
          available={availableLabel}
          value={amount}
          onChange={setAmount}
          onMax={() => setAmount(available)}
          maxLabel={ru.transferModal.maxAction}
          transferVariant
          assetSelect={(
            <Select
              label=""
              layout="asset"
              options={assets.map((asset) => ({
                value: asset.ticker,
                label: asset.ticker,
                icon: <CurrencyIcon ticker={asset.ticker} size={24}/>,
              }))}
              value={ticker}
              onChange={setTicker}
            />
          )}
        />
      </div>
    </Modal>
  );
}
