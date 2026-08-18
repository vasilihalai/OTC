import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { SavedOptionSelect, NEW_OPTION_VALUE } from '@/components/SavedOptionSelect/SavedOptionSelect.tsx';
import { getAssets, getFiatWithdrawalRules, getSavedRequisites, submitFiatWithdrawal } from '@/api/index.ts';
import type { Asset, FiatTransferType, FiatWithdrawalRules, SavedRequisite } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawFiat.css';

const FIAT_TICKERS = ['KGS', 'RUB', 'USD'];

export function WithdrawFiat() {
  useRequireSession();
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as { ticker?: string } | null)?.ticker;

  const [ticker, setTicker] = useState(preselected && FIAT_TICKERS.includes(preselected) ? preselected : FIAT_TICKERS[0]);
  const [transferType, setTransferType] = useState<FiatTransferType>('internal');
  const [asset, setAsset] = useState<Asset>();
  const [rules, setRules] = useState<FiatWithdrawalRules>();
  const [savedRequisites, setSavedRequisites] = useState<SavedRequisite[]>([]);
  const [requisiteChoice, setRequisiteChoice] = useState<string>(NEW_OPTION_VALUE);
  const [account, setAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bic, setBic] = useState('');
  const [inn, setInn] = useState('');
  const [correspondentAccount, setCorrespondentAccount] = useState('');
  const [saveRequisite, setSaveRequisite] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountError, setAccountError] = useState<string>();
  const [amountError, setAmountError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    void Promise.all([getFiatWithdrawalRules(ticker), getAssets('fiat')]).then(([rulesData, assets]) => {
      setRules(rulesData);
      setAsset(assets.find((a) => a.ticker === ticker));
    });
  }, [ticker]);

  useEffect(() => {
    void getSavedRequisites(ticker).then((requisites) => {
      const matching = requisites.filter((r) => r.transferType === transferType);
      setSavedRequisites(matching);
      setRequisiteChoice(matching[0]?.id ?? NEW_OPTION_VALUE);
    });
  }, [ticker, transferType]);

  const selectedRequisite = savedRequisites.find((r) => r.id === requisiteChoice);
  const isNewRequisite = requisiteChoice === NEW_OPTION_VALUE;
  const available = asset?.balance ?? '0';
  const feePercent = rules?.feePercent ?? 0;

  const maxAmount = useMemo(() => {
    if (!available) {
      return '0';
    }
    const max = Number(available) / (1 + feePercent / 100);
    return max > 0 ? max.toFixed(2) : '0';
  }, [available, feePercent]);

  const fee = useMemo(() => (amount ? (Number(amount) * feePercent) / 100 : 0), [amount, feePercent]);
  const totalDebit = amount ? Number(amount) + fee : 0;

  function handleMax() {
    setAmount(maxAmount);
    setAmountError(undefined);
  }

  async function handleConfirm() {
    setAccountError(undefined);
    setAmountError(undefined);

    let hasError = false;
    if (isNewRequisite && !account.trim()) {
      setAccountError(ru.withdraw.errorAccountRequired);
      hasError = true;
    }
    if (rules && Number(amount) < Number(rules.min)) {
      setAmountError(ru.withdraw.errorBelowMin);
      hasError = true;
    } else if (totalDebit > Number(available)) {
      setAmountError(ru.withdraw.errorAboveAvailable);
      hasError = true;
    }
    if (hasError) {
      notifyError();
      return;
    }

    setSubmitting(true);
    try {
      await submitFiatWithdrawal({
        ticker,
        transferType,
        account: isNewRequisite ? account : (selectedRequisite?.account ?? ''),
        bankName: isNewRequisite ? bankName : selectedRequisite?.bankName,
        bic: isNewRequisite ? bic : selectedRequisite?.bic,
        inn: isNewRequisite ? inn : selectedRequisite?.inn,
        correspondentAccount: isNewRequisite ? correspondentAccount : selectedRequisite?.correspondentAccount,
        amount,
        saveRequisite: isNewRequisite && saveRequisite,
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
      <div className="withdraw-fiat">
        <Panel>
          <h1 className="withdraw-fiat__success-title">{ru.withdraw.successTitle}</h1>
          <p className="withdraw-fiat__success-body">{ru.withdraw.successBody}</p>
          <Button onClick={() => navigate('/home', { replace: true })}>{ru.withdraw.doneAction}</Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="withdraw-fiat">
      <h1 className="withdraw-fiat__title">{ru.withdraw.fiatTitle}</h1>

      <div className="withdraw-fiat__field">
        <span className="withdraw-fiat__label">{ru.withdraw.currencyLabel}</span>
        <SegmentedControl
          options={FIAT_TICKERS.map((t) => ({ value: t, label: t }))}
          value={ticker}
          onChange={setTicker}
        />
      </div>

      <div className="withdraw-fiat__field">
        <span className="withdraw-fiat__label">{ru.withdraw.transferTypeLabel}</span>
        <SegmentedControl
          options={[
            { value: 'internal' as const, label: ru.withdraw.transferTypeInternal },
            { value: 'kg' as const, label: ru.withdraw.transferTypeKg },
            { value: 'ru' as const, label: ru.withdraw.transferTypeRu },
          ]}
          value={transferType}
          onChange={setTransferType}
        />
      </div>

      <SavedOptionSelect
        label={ru.withdraw.requisiteLabel}
        options={savedRequisites.map((r) => ({ id: r.id, label: r.label }))}
        value={requisiteChoice}
        onChange={setRequisiteChoice}
        newOptionLabel={ru.withdraw.newRequisiteOption}
        manageLabel={ru.withdraw.manageRequisites}
        onManage={() => navigate('/manage/requisites')}
      />

      {isNewRequisite ? (
        <>
          {transferType !== 'internal' && (
            <>
              <TextField label={ru.withdraw.bicLabel} value={bic} onChange={(e) => setBic(e.target.value)}/>
              <TextField label={ru.withdraw.bankNameLabel} value={bankName} onChange={(e) => setBankName(e.target.value)}/>
              <TextField label={ru.withdraw.innLabel} value={inn} onChange={(e) => setInn(e.target.value)}/>
            </>
          )}
          {transferType === 'ru' && (
            <TextField
              label={ru.withdraw.correspondentAccountLabel}
              value={correspondentAccount}
              onChange={(e) => setCorrespondentAccount(e.target.value)}
            />
          )}
          <TextField
            label={ru.withdraw.recipientAccountLabel}
            value={account}
            error={accountError}
            onChange={(e) => setAccount(e.target.value)}
          />
          <label className="withdraw-fiat__checkbox">
            <input type="checkbox" checked={saveRequisite} onChange={(e) => setSaveRequisite(e.target.checked)}/>
            {ru.withdraw.saveRequisiteLabel}
          </label>
        </>
      ) : (
        selectedRequisite && (
          <Panel surface="card">
            {selectedRequisite.bankName && <KeyValueRow label={ru.withdraw.bankNameLabel} value={selectedRequisite.bankName}/>}
            <KeyValueRow label={ru.withdraw.recipientAccountLabel} value={selectedRequisite.account}/>
          </Panel>
        )
      )}

      <div className="withdraw-fiat__amount-row">
        <TextField
          label={`${ru.withdraw.amountLabel} · ${ru.withdraw.availableLabel}: ${formatAmount(available, ticker)} ${ticker}`}
          inputMode="decimal"
          value={amount}
          error={amountError}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" variant="link" className="withdraw-fiat__max" onClick={handleMax}>
          {ru.withdraw.maxAction}
        </Button>
      </div>

      {rules && (
        <Panel surface="card">
          <KeyValueRow label={ru.withdraw.minAmountLabel} value={`${formatAmount(rules.min, ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.limitLabel} value={`${formatAmount(rules.limit, ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.payoutLabel} value={`${formatAmount(amount || '0', ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.feeLabel} value={`${formatAmount(String(fee), ticker)} ${ticker}`}/>
          <KeyValueRow label={ru.withdraw.totalDebitLabel} value={`${formatAmount(String(totalDebit), ticker)} ${ticker}`}/>
        </Panel>
      )}

      <div className="withdraw-fiat__actions">
        <Button loading={submitting} onClick={() => void handleConfirm()}>{ru.withdraw.confirmAction}</Button>
        <Button type="button" variant="link" onClick={() => navigate(-1)}>{ru.withdraw.cancelAction}</Button>
      </div>
    </div>
  );
}
