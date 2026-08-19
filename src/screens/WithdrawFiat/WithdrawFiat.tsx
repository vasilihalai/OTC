import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Select } from '@/components/Select/Select.tsx';
import { AmountField } from '@/components/AmountField/AmountField.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Panel } from '@/components/Panel/Panel.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getAssets, getWithdrawFiatOptions } from '@/api/index.ts';
import type { Asset, FiatWithdrawOptions } from '@/api/index.ts';
import type { WithdrawFiatRouteState } from '@/screens/WithdrawRequisites/WithdrawRequisites.tsx';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { useTransferModalStore } from '@/store/transferModal.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawFiat.css';

export function WithdrawFiat() {
  useRequireSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('asset');
  const balancesVersion = useUiStore((s) => s.balancesVersion);
  const openTransferModal = useTransferModalStore((s) => s.open);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [currency, setCurrency] = useState(preselected ?? '');
  const [options, setOptions] = useState<FiatWithdrawOptions>();
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    void getAssets('fiat').then((data) => {
      setAssets(data);
      setCurrency((current) => (current && data.some((a) => a.ticker === current) ? current : (data[0]?.ticker ?? '')));
      setInitialLoading(false);
    });
  }, [balancesVersion]);

  useEffect(() => {
    if (!currency) {
      return;
    }
    void getWithdrawFiatOptions(currency).then((data) => {
      setOptions(data);
      setMethodId((current) => (data.methods.some((m) => m.id === current) ? current : (data.methods[0]?.id ?? '')));
    });
  }, [currency]);

  const asset = assets.find((a) => a.ticker === currency);
  const available = asset?.balance ?? '0';
  const method = options?.methods.find((m) => m.id === methodId);
  const feePercent = method ? Number(method.feePct) : 0;

  const maxAmount = useMemo(() => {
    if (!available) {
      return '0';
    }
    const max = Number(available) / (1 + feePercent / 100);
    return max > 0 ? max.toFixed(2) : '0';
  }, [available, feePercent]);

  const fee = amount ? (Number(amount) * feePercent) / 100 : 0;
  const totalDebit = amount ? Number(amount) + fee : 0;

  function handleMax() {
    setAmount(maxAmount);
    setAmountError(undefined);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    if (!value) {
      setAmountError(undefined);
      return;
    }
    const enteredTotal = Number(value) + (Number(value) * feePercent) / 100;
    setAmountError(enteredTotal > Number(available) ? ru.withdraw.errorInsufficientFunds : undefined);
  }

  function handleContinue() {
    setAmountError(undefined);
    if (options && Number(amount) < Number(options.limits.min)) {
      setAmountError(ru.withdraw.errorBelowMin);
      notifyError();
      return;
    }
    if (totalDebit > Number(available)) {
      setAmountError(ru.withdraw.errorAboveAvailable);
      notifyError();
      return;
    }

    const state: WithdrawFiatRouteState = { ticker: currency, methodId, amount };
    navigate('/withdraw/fiat/requisites', { state });
  }

  if (initialLoading) {
    return (
      <div className="withdraw-fiat">
        <h1 className="withdraw-fiat__title">{ru.withdraw.fiatTitle}</h1>
        <Skeleton height={48} radius={12}/>
        <Skeleton height={48} radius={12}/>
        <Panel surface="card">
          <Skeleton height={100} radius={8}/>
        </Panel>
      </div>
    );
  }

  return (
    <div className="withdraw-fiat">
      <div className="withdraw-fiat__scroll">
        <h1 className="withdraw-fiat__title">{ru.withdraw.fiatTitle}</h1>

        <h2 className="withdraw-fiat__section-title">{ru.withdraw.chooseCurrencyMethodTitle}</h2>
        <Select
          label={ru.withdraw.currencyLabel}
          layout="asset"
          options={assets.map((a) => ({
            value: a.ticker,
            label: a.ticker,
            secondary: a.name,
            icon: <CurrencyIcon ticker={a.ticker} size={24}/>,
          }))}
          value={currency}
          onChange={setCurrency}
        />
        {options && (
          <Select
            label={ru.withdraw.methodLabel}
            layout="method"
            options={options.methods.map((m) => ({ value: m.id, label: m.name, secondary: `${m.feePct}%` }))}
            value={methodId}
            onChange={setMethodId}
          />
        )}

        <h2 className="withdraw-fiat__section-title">{ru.withdraw.amountSectionTitle}</h2>
        <AmountField
          label={ru.withdraw.sendLabel}
          availableLabel={ru.withdraw.balanceLabel}
          available={`${formatAmount(available, currency)} ${currency}`}
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
              { key: 'min', label: ru.withdraw.minAmountLabel, value: `${formatAmount(options.limits.min, currency)} ${currency}` },
              { key: 'limit', label: ru.withdraw.limitLabel, value: `${formatAmount(options.limits.available, currency)} ${currency}` },
              { key: 'amount', label: ru.withdraw.enteredAmountLabel, value: `${formatAmount(amount || '0', currency)} ${currency}` },
              { key: 'fee', label: ru.withdraw.feeLabel, value: `${formatAmount(String(fee), currency)} ${currency}` },
            ]}
            totalLabel={ru.withdraw.totalDebitLabel}
            totalValue={`${formatAmount(String(totalDebit), currency)} ${currency}`}
          />
        )}
      </div>

      <div className="withdraw-fiat__submit">
        <Button variant="accent" onClick={handleContinue}>{ru.withdraw.confirmAction}</Button>
      </div>
    </div>
  );
}
