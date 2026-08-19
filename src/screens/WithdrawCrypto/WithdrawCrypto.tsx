import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { SavedOptionSelect, NEW_OPTION_VALUE } from '@/components/SavedOptionSelect/SavedOptionSelect.tsx';
import {
  getAssets,
  getCryptoWithdrawalRules,
  getSavedAddresses,
  submitCryptoWithdrawal,
} from '@/api/index.ts';
import type { Asset, CryptoNetwork, CryptoWithdrawalRules, SavedAddress } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawCrypto.css';

const CRYPTO_TICKERS = ['USDT', 'USDC', 'BTC'];

export function WithdrawCrypto() {
  useRequireSession();
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as { ticker?: string } | null)?.ticker;

  const [ticker, setTicker] = useState(preselected && CRYPTO_TICKERS.includes(preselected) ? preselected : CRYPTO_TICKERS[0]);
  const [network, setNetwork] = useState<CryptoNetwork>();
  const [asset, setAsset] = useState<Asset>();
  const [rules, setRules] = useState<CryptoWithdrawalRules>();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressChoice, setAddressChoice] = useState<string>(NEW_OPTION_VALUE);
  const [manualAddress, setManualAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [addressError, setAddressError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    void Promise.all([
      getCryptoWithdrawalRules(ticker),
      getSavedAddresses(ticker),
      getAssets('crypto'),
    ]).then(([rulesData, addresses, assets]) => {
      setRules(rulesData);
      setSavedAddresses(addresses);
      setAddressChoice(addresses[0]?.id ?? NEW_OPTION_VALUE);
      setAsset(assets.find((a) => a.ticker === ticker));
      setNetwork(rulesData.networks[0]);
      setInitialLoading(false);
    });
  }, [ticker]);

  const selectedAddress = savedAddresses.find((a) => a.id === addressChoice);
  const address = addressChoice === NEW_OPTION_VALUE ? manualAddress : (selectedAddress?.address ?? '');
  const available = asset?.balance ?? '0';

  const payout = useMemo(() => {
    if (!rules || !amount) {
      return '0';
    }
    const net = Number(amount) - Number(rules.networkFee);
    return net > 0 ? String(net) : '0';
  }, [amount, rules]);

  function handleMax() {
    setAmount(available);
    setAmountError(undefined);
  }

  async function handleConfirm() {
    setAddressError(undefined);
    setAmountError(undefined);

    let hasError = false;
    if (!address.trim()) {
      setAddressError(ru.withdraw.errorAddressRequired);
      hasError = true;
    }
    if (rules && Number(amount) < Number(rules.min)) {
      setAmountError(ru.withdraw.errorBelowMin);
      hasError = true;
    } else if (Number(amount) > Number(available)) {
      setAmountError(ru.withdraw.errorAboveAvailable);
      hasError = true;
    }
    if (hasError) {
      notifyError();
      return;
    }

    setSubmitting(true);
    try {
      await submitCryptoWithdrawal({
        ticker,
        network,
        address,
        amount,
        idempotencyKey: idempotencyKey.current,
      });
      notifySuccess();
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="withdraw-crypto">
        <Panel>
          <h1 className="withdraw-crypto__success-title">{ru.withdraw.successTitle}</h1>
          <p className="withdraw-crypto__success-body">{ru.withdraw.successBody}</p>
          <Button onClick={() => navigate('/home', { replace: true })}>{ru.withdraw.doneAction}</Button>
        </Panel>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="withdraw-crypto">
        <h1 className="withdraw-crypto__title">{ru.withdraw.cryptoTitle}</h1>
        <Skeleton height={44} radius={999}/>
        <Skeleton height={48} radius={12}/>
        <Skeleton height={48} radius={12}/>
        <Panel surface="card">
          <Skeleton height={80} radius={8}/>
        </Panel>
      </div>
    );
  }

  return (
    <div className="withdraw-crypto">
      <h1 className="withdraw-crypto__title">{ru.withdraw.cryptoTitle}</h1>

      <div className="withdraw-crypto__field">
        <span className="withdraw-crypto__label">{ru.withdraw.assetLabel}</span>
        <SegmentedControl
          options={CRYPTO_TICKERS.map((t) => ({ value: t, label: t }))}
          value={ticker}
          onChange={setTicker}
        />
      </div>

      <SavedOptionSelect
        label={ru.withdraw.addressLabel}
        options={savedAddresses.map((a) => ({ id: a.id, label: `${a.label} · ${a.address.slice(0, 6)}…${a.address.slice(-4)}` }))}
        value={addressChoice}
        onChange={setAddressChoice}
        newOptionLabel={ru.withdraw.newAddressOption}
        manageLabel={ru.withdraw.manageAddresses}
        onManage={() => navigate('/manage/addresses')}
      />
      {addressChoice === NEW_OPTION_VALUE && (
        <TextField
          label={ru.withdraw.addressPlaceholder}
          value={manualAddress}
          error={addressError}
          onChange={(e) => setManualAddress(e.target.value)}
        />
      )}

      {rules && rules.networks.length > 0 && (
        <div className="withdraw-crypto__field">
          <span className="withdraw-crypto__label">{ru.withdraw.networkLabel}</span>
          <SegmentedControl
            options={rules.networks.map((n) => ({ value: n, label: n }))}
            value={network ?? rules.networks[0]}
            onChange={(v) => setNetwork(v)}
          />
        </div>
      )}

      <TextField
        label={`${ru.withdraw.amountLabel} · ${ru.withdraw.availableLabel}: ${formatAmount(available, ticker)} ${ticker}`}
        inputMode="decimal"
        value={amount}
        error={amountError}
        onChange={(e) => setAmount(e.target.value)}
        suffix={(
          <Button type="button" variant="link" onClick={handleMax}>
            {ru.withdraw.maxAction}
          </Button>
        )}
      />

      {rules && (
        <Panel surface="card">
          <KeyValueRow label={ru.withdraw.minAmountLabel} value={`${formatAmount(rules.min, ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.limitLabel} value={`${formatAmount(rules.limit, ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.feeLabel} value={`${formatAmount(rules.networkFee, ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.payoutLabel} value={`${formatAmount(payout, ticker)} ${ticker}`}/>
        </Panel>
      )}

      <p className="withdraw-crypto__warning">{ru.withdraw.cryptoWarning}</p>

      <div className="withdraw-crypto__actions">
        <Button loading={submitting} onClick={() => void handleConfirm()}>{ru.withdraw.confirmAction}</Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>{ru.withdraw.cancelAction}</Button>
      </div>
    </div>
  );
}
