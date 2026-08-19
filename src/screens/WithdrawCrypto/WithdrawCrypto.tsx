import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { AmountField } from '@/components/AmountField/AmountField.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { Callout } from '@/components/Callout/Callout.tsx';
import { HelpTip } from '@/components/HelpTip/HelpTip.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getAssets, getWithdrawCryptoOptions, submitCryptoWithdrawal } from '@/api/index.ts';
import type { Asset, CryptoWithdrawOptions } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { useTransferModalStore } from '@/store/transferModal.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawCrypto.css';

export function WithdrawCrypto() {
  useRequireSession();
  const navigate = useNavigate();
  const openTransferModal = useTransferModalStore((s) => s.open);
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('asset');
  const bumpBalancesVersion = useUiStore((s) => s.bumpBalancesVersion);
  const balancesVersion = useUiStore((s) => s.balancesVersion);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [ticker, setTicker] = useState(preselected ?? '');
  const [options, setOptions] = useState<CryptoWithdrawOptions>();
  const [addressId, setAddressId] = useState('');
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    void getAssets('crypto').then((data) => {
      setAssets(data);
      setTicker((current) => (current && data.some((a) => a.ticker === current) ? current : (data[0]?.ticker ?? '')));
      setInitialLoading(false);
    });
  }, [balancesVersion]);

  useEffect(() => {
    if (!ticker) {
      return;
    }
    void getWithdrawCryptoOptions(ticker).then((data) => {
      setOptions(data);
      setAddressId(data.addresses[0]?.id ?? '');
    });
  }, [ticker]);

  const asset = assets.find((a) => a.ticker === ticker);
  const available = asset?.balance ?? '0';
  const selectedAddress = options?.addresses.find((a) => a.id === addressId);
  const compatibleNetworks = options && selectedAddress
    ? options.networks.filter((n) => selectedAddress.networks.includes(n))
    : (options?.networks ?? []);
  const isBtc = ticker === 'BTC';

  // Keeps the network selection valid whenever the address (or its
  // compatible-network set) changes — a stale value would otherwise leave
  // the Select unable to match any option.
  useEffect(() => {
    if (compatibleNetworks.length > 0 && !compatibleNetworks.includes(network)) {
      setNetwork(compatibleNetworks[0]);
    }
  }, [addressId, options]);

  function handleMax() {
    setAmount(available);
    setAmountError(undefined);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    setAmountError(undefined);
  }

  function handleTickerChange(value: string) {
    setTicker(value);
    setAddressId('');
    setNetwork('');
  }

  const canConfirm = !!options && options.addresses.length > 0;

  async function handleConfirm() {
    setAmountError(undefined);
    if (options && Number(amount) < Number(options.limits.min)) {
      setAmountError(ru.withdraw.errorBelowMin);
      notifyError();
      return;
    }
    if (Number(amount) > Number(available)) {
      setAmountError(ru.withdraw.errorAboveAvailable);
      notifyError();
      return;
    }

    setSubmitting(true);
    try {
      await submitCryptoWithdrawal({
        ticker,
        network,
        addressId,
        amount,
        idempotencyKey: idempotencyKey.current,
      });
      notifySuccess();
      bumpBalancesVersion();
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
          <Button variant="accent" onClick={() => navigate('/home', { replace: true })}>{ru.withdraw.doneAction}</Button>
        </Panel>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="withdraw-crypto">
        <h1 className="withdraw-crypto__title">{ru.withdraw.cryptoTitle}</h1>
        <Skeleton height={48} radius={12}/>
        <Skeleton height={48} radius={12}/>
        <Panel surface="card">
          <Skeleton height={100} radius={8}/>
        </Panel>
      </div>
    );
  }

  return (
    <div className="withdraw-crypto">
      <div className="withdraw-crypto__scroll">
        <h1 className="withdraw-crypto__title">{ru.withdraw.cryptoTitle}</h1>

        <h2 className="withdraw-crypto__section-title">{ru.withdraw.chooseAssetTitle}</h2>
        <Select
          label={ru.withdraw.assetLabel}
          layout="asset"
          options={assets.map((a) => ({
            value: a.ticker,
            label: a.ticker,
            secondary: a.name,
            icon: <CurrencyIcon ticker={a.ticker} size={24}/>,
          }))}
          value={ticker}
          onChange={handleTickerChange}
        />

        <h2 className="withdraw-crypto__section-title">
          {ru.withdraw.chooseAddressNetworkTitle}
        </h2>
        <div className="withdraw-crypto__address-label">
          <span>{ru.withdraw.addressLabel}</span>
          <HelpTip text={ru.withdraw.addressHelpText}/>
        </div>
        <Select
          label=""
          layout="address"
          options={(options?.addresses ?? []).map((a) => ({ value: a.id, label: a.address }))}
          value={addressId}
          onChange={setAddressId}
          emptyState={(
            <div className="withdraw-crypto__empty-address">
              <p className="withdraw-crypto__empty-address-title">{ru.withdraw.noSavedAddresses}</p>
              <p className="withdraw-crypto__empty-address-caption">{ru.withdraw.noSavedAddressesCaption}</p>
            </div>
          )}
        />
        {!isBtc && compatibleNetworks.length > 0 && (
          <Select
            label={ru.withdraw.networkLabel}
            layout="plain"
            options={compatibleNetworks.map((n) => ({ value: n, label: n }))}
            value={network}
            onChange={setNetwork}
          />
        )}

        <h2 className="withdraw-crypto__section-title">{ru.withdraw.amountSectionTitle}</h2>
        <AmountField
          label={ru.withdraw.sendLabel}
          availableLabel={ru.withdraw.balanceLabel}
          available={`${formatAmount(available, ticker)} ${ticker}`}
          value={amount}
          onChange={handleAmountChange}
          onMax={handleMax}
          maxLabel={ru.withdraw.maxAction}
          error={amountError}
          onTransfer={openTransferModal}
        />

        {options && (
          <SummaryCard
            rows={[
              { key: 'min', label: ru.withdraw.minAmountLabel, value: `${formatAmount(options.limits.min, ticker)} ${ticker}` },
              { key: 'limit', label: ru.withdraw.limitLabel, value: `${formatAmount(options.limits.available, ticker)} ${ticker}` },
              ...(options.limits.contractTail
                ? [{
                  key: 'contract',
                  label: ru.withdraw.contractAddressLabel,
                  value: ru.withdraw.contractTailPrefixText,
                  tail: options.limits.contractTail,
                }]
                : []),
              { key: 'fee', label: ru.withdraw.feeLabel, value: `${formatAmount(options.limits.fee, ticker)} ${ticker}` },
            ]}
            totalLabel={ru.withdraw.payoutLabel}
            totalValue={`${formatAmount(amount || '0', ticker)} ${ticker}`}
            caption={ru.withdraw.feeCaption}
          />
        )}

        <Callout variant="danger">
          <b>{ru.withdraw.warningTitle}</b> {ru.withdraw.cryptoWarning}
        </Callout>
      </div>

      <div className="withdraw-crypto__submit">
        <Button variant="accent" loading={submitting} disabled={!canConfirm} onClick={() => void handleConfirm()}>
          {ru.withdraw.confirmAction}
        </Button>
      </div>
    </div>
  );
}
