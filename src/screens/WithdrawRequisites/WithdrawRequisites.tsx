import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { Checkbox } from '@/components/Checkbox/Checkbox.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { TwoFactorGate } from '@/components/TwoFactorGate/TwoFactorGate.tsx';
import { getSavedRequisites, getUser, getWithdrawFiatOptions, submitFiatWithdrawal } from '@/api/index.ts';
import type { FiatTransferType, FiatWithdrawOptions, SavedRequisite } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawRequisites.css';

export interface WithdrawFiatRouteState {
  ticker: string;
  methodId: string;
  amount: string;
}

const NEW_OPTION = '__new__';

export function WithdrawRequisites() {
  const session = useRequireSession();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as WithdrawFiatRouteState | null;
  const bumpBalancesVersion = useUiStore((s) => s.bumpBalancesVersion);

  const [saved, setSaved] = useState<SavedRequisite[]>([]);
  const [choice, setChoice] = useState<string>(NEW_OPTION);
  const [transferType, setTransferType] = useState<FiatTransferType>('internal');
  const [account, setAccount] = useState('');
  const [bic, setBic] = useState('');
  const [recipientBic, setRecipientBic] = useState('');
  const [bankName, setBankName] = useState('');
  const [inn, setInn] = useState('');
  const [corrAccount, setCorrAccount] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);
  const [options, setOptions] = useState<FiatWithdrawOptions>();
  const [accountError, setAccountError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authenticatorOpen, setAuthenticatorOpen] = useState(false);
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!routeState) {
      navigate('/withdraw/fiat', { replace: true });
    }
  }, [routeState, navigate]);

  useEffect(() => {
    if (session) {
      void getUser(session.clientType).then((user) => setAuthenticatorEnabled(user.authenticatorEnabled));
    }
  }, [session]);

  useEffect(() => {
    void getSavedRequisites().then(setSaved);
  }, []);

  useEffect(() => {
    if (routeState) {
      void getWithdrawFiatOptions(routeState.ticker).then(setOptions);
    }
  }, [routeState]);

  if (!routeState) {
    return null;
  }

  const { ticker, amount, methodId } = routeState;
  const isNew = choice === NEW_OPTION;
  const selected = saved.find((r) => r.id === choice);
  const feePercent = options?.methods.find((m) => m.id === methodId)?.feePct;
  const fee = feePercent ? (Number(amount) * Number(feePercent)) / 100 : 0;
  const totalDebit = Number(amount) + fee;

  function handleConfirm() {
    setAccountError(undefined);
    if (isNew && !account.trim()) {
      setAccountError(ru.withdraw.errorAccountRequired);
      notifyError();
      return;
    }

    setAuthenticatorOpen(true);
  }

  async function handleAuthenticated() {
    setSubmitting(true);
    try {
      await submitFiatWithdrawal({
        ticker,
        methodId,
        amount,
        requisites: isNew
          ? {
            transferType,
            account,
            bankName: transferType !== 'internal' ? bankName : undefined,
            bic: transferType === 'ru' ? recipientBic : (transferType === 'kg' ? bic : undefined),
            inn: transferType !== 'internal' ? inn : undefined,
            correspondentAccount: transferType === 'ru' ? corrAccount : undefined,
            saveForLater,
          }
          : {
            transferType: selected?.transferType ?? 'internal',
            account: selected?.account ?? '',
            bankName: selected?.bankName,
            bic: selected?.bic,
            inn: selected?.inn,
            correspondentAccount: selected?.correspondentAccount,
            saveForLater: false,
          },
        idempotencyKey: idempotencyKey.current,
      });
      bumpBalancesVersion();
      setSuccess(true);
      setAuthenticatorOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="withdraw-requisites">
        <Panel>
          <h1 className="withdraw-requisites__success-title">{ru.withdraw.successTitle}</h1>
          <p className="withdraw-requisites__success-body">{ru.withdraw.successBody}</p>
          <Button variant="accent" onClick={() => navigate('/home', { replace: true })}>{ru.withdraw.doneAction}</Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="withdraw-requisites">
      <h1 className="withdraw-requisites__title">{ru.withdraw.requisitesTitle}</h1>

      <Select
        label={ru.withdraw.savedRequisiteLabel}
        layout="plain"
        options={[
          ...saved.map((r) => ({ value: r.id, label: r.label })),
          { value: NEW_OPTION, label: ru.withdraw.newRequisiteOption },
        ]}
        value={choice}
        onChange={setChoice}
      />

      {isNew && (
        <>
          <SegmentedControl
            options={[
              { value: 'internal' as const, label: ru.withdraw.transferTypeInternal },
              { value: 'kg' as const, label: ru.withdraw.transferTypeKg },
              { value: 'ru' as const, label: ru.withdraw.transferTypeRu },
            ]}
            value={transferType}
            onChange={setTransferType}
          />

          {transferType === 'ru' && (
            <TextField label={ru.withdraw.recipientBicLabel} placeholder={ru.withdraw.bicPlaceholder} value={recipientBic} onChange={(e) => setRecipientBic(e.target.value)}/>
          )}
          {transferType !== 'internal' && (
            <TextField label={ru.withdraw.innLabel} placeholder={ru.withdraw.innPlaceholder} value={inn} onChange={(e) => setInn(e.target.value)}/>
          )}
          {transferType !== 'internal' && (
            <TextField label={ru.withdraw.bankNameLabel} placeholder={ru.withdraw.bankNamePlaceholder} value={bankName} onChange={(e) => setBankName(e.target.value)}/>
          )}
          {transferType === 'kg' && (
            <TextField label={ru.withdraw.bicLabel} placeholder={ru.withdraw.bicPlaceholder} value={bic} onChange={(e) => setBic(e.target.value)}/>
          )}
          {transferType === 'ru' && (
            <TextField label={ru.withdraw.bankBicLabel} placeholder={ru.withdraw.bicPlaceholder} value={bic} onChange={(e) => setBic(e.target.value)}/>
          )}
          {transferType === 'ru' && (
            <TextField label={ru.withdraw.correspondentAccountLabel} placeholder={ru.withdraw.correspondentAccountPlaceholder} value={corrAccount} onChange={(e) => setCorrAccount(e.target.value)}/>
          )}
          <TextField
            label={ru.withdraw.recipientAccountLabel}
            placeholder={ru.withdraw.recipientAccountPlaceholder}
            value={account}
            error={accountError}
            onChange={(e) => setAccount(e.target.value)}
          />

          <Checkbox checked={saveForLater} onChange={setSaveForLater} label={ru.withdraw.saveRequisiteLabel}/>
        </>
      )}

      {options && (
        <SummaryCard
          rows={[
            { key: 'min', label: ru.withdraw.minAmountLabel, value: `${formatAmount(options.limits.min, ticker)} ${ticker}` },
            { key: 'limit', label: ru.withdraw.limitLabel, value: `${formatAmount(options.limits.available, ticker)} ${ticker}` },
            { key: 'amount', label: ru.withdraw.enteredAmountLabel, value: `${formatAmount(amount, ticker)} ${ticker}` },
            { key: 'fee', label: ru.withdraw.feeLabel, value: `${formatAmount(String(fee), ticker)} ${ticker}` },
          ]}
          totalLabel={ru.withdraw.totalDebitLabel}
          totalValue={`${formatAmount(String(totalDebit), ticker)} ${ticker}`}
        />
      )}

      <div className="button-row">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{ru.withdraw.cancelAction}</Button>
        <Button disabled={submitting} onClick={handleConfirm}>{ru.withdraw.confirmAction}</Button>
      </div>

      <TwoFactorGate
        open={authenticatorOpen}
        authenticatorEnabled={authenticatorEnabled}
        email={session?.email ?? ''}
        onClose={() => setAuthenticatorOpen(false)}
        onVerified={handleAuthenticated}
      />
    </div>
  );
}
