import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { Checkbox } from '@/components/Checkbox/Checkbox.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { TwoFactorGate } from '@/components/TwoFactorGate/TwoFactorGate.tsx';
import {
  MockVerifyCodeError,
  getSavedRequisites,
  getUser,
  getWithdrawFiatOptions,
  sendVerificationCode,
  submitFiatWithdrawal,
  verifyCode,
} from '@/api/index.ts';
import type { FiatWithdrawOptions, SavedRequisite } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { formatAmount } from '@/lib/money.ts';
import { RateLimitedError } from '@/lib/rateLimitedError.ts';
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

  // The requisites field set is decided by the withdrawal method chosen on
  // the previous screen — it's not a separate choice made here.
  const transferType = options?.methods.find((m) => m.id === routeState?.methodId)?.transferType ?? 'internal';
  // Only requisites saved for this same field set make sense to offer —
  // picking one that doesn't match would populate fields the current
  // method doesn't even show.
  const compatibleSaved = saved.filter((r) => r.transferType === transferType);
  const isNew = choice === NEW_OPTION;
  const selected = compatibleSaved.find((r) => r.id === choice);

  // Fields never disappear — picking a saved requisite fills them in
  // (read-only) instead of hiding the form; picking "new" clears them for
  // manual entry.
  useEffect(() => {
    if (selected) {
      setAccount(selected.account);
      setBankName(selected.bankName ?? '');
      setInn(selected.inn ?? '');
      setCorrAccount(selected.correspondentAccount ?? '');
      setBic(selected.bic ?? '');
      setRecipientBic(selected.bic ?? '');
      setSaveForLater(false);
    } else {
      setAccount('');
      setBankName('');
      setInn('');
      setCorrAccount('');
      setBic('');
      setRecipientBic('');
    }
    setAccountError(undefined);
  }, [choice, selected]);

  if (!routeState) {
    return null;
  }

  const { ticker, amount, methodId } = routeState;
  const feePercent = options?.methods.find((m) => m.id === methodId)?.feePct;
  const fee = feePercent ? (Number(amount) * Number(feePercent)) / 100 : 0;
  const totalDebit = Number(amount) + fee;

  function handleConfirm() {
    setAccountError(undefined);
    if (!account.trim()) {
      setAccountError(ru.withdraw.errorAccountRequired);
      notifyError();
      return;
    }

    setAuthenticatorOpen(true);
  }

  // TODO(withdrawals-fiat-round): still the old generic verifyCode/
  // sendVerificationCode pair wrapped in TwoFactorGate's new onSubmit/
  // onResend shape — not api-integration.md §5.3's real issue-otp/confirm
  // contract yet. That's the fiat half of the Withdrawals step, not done
  // this round (only crypto was — see WithdrawCrypto.tsx).
  async function handleOtpSubmit(code: string) {
    try {
      await verifyCode(code);
    } catch (err) {
      if (err instanceof MockVerifyCodeError && err.code === 'RATE_LIMIT') {
        throw new RateLimitedError();
      }
      throw new Error(ru.verification.errorCodeInvalid);
    }
    setSubmitting(true);
    try {
      await submitFiatWithdrawal({
        ticker,
        methodId,
        amount,
        requisites: {
          transferType,
          account,
          bankName: transferType !== 'internal' ? bankName : undefined,
          bic: transferType === 'ru' ? recipientBic : (transferType === 'kg' ? bic : undefined),
          inn: transferType !== 'internal' ? inn : undefined,
          correspondentAccount: transferType === 'ru' ? corrAccount : undefined,
          saveForLater: isNew && saveForLater,
        },
        idempotencyKey: idempotencyKey.current,
      });
      bumpBalancesVersion();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpResend() {
    await sendVerificationCode(session?.email ?? '');
  }

  function handleOtpVerified() {
    setAuthenticatorOpen(false);
    setSuccess(true);
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
      <div className="withdraw-requisites__scroll">
      <h1 className="withdraw-requisites__title">{ru.withdraw.requisitesTitle}</h1>

      {compatibleSaved.length > 0 && (
        <Select
          label={ru.withdraw.savedRequisiteLabel}
          layout="plain"
          options={[
            ...compatibleSaved.map((r) => ({ value: r.id, label: r.label })),
            { value: NEW_OPTION, label: ru.withdraw.newRequisiteOption },
          ]}
          value={choice}
          onChange={setChoice}
        />
      )}

      {transferType === 'ru' && (
        <TextField label={ru.withdraw.recipientBicLabel} placeholder={ru.withdraw.bicPlaceholder} value={recipientBic} disabled={!isNew} onChange={(e) => setRecipientBic(e.target.value)}/>
      )}
      {transferType !== 'internal' && (
        <TextField label={ru.withdraw.innLabel} placeholder={ru.withdraw.innPlaceholder} value={inn} disabled={!isNew} onChange={(e) => setInn(e.target.value)}/>
      )}
      {transferType !== 'internal' && (
        <TextField label={ru.withdraw.bankNameLabel} placeholder={ru.withdraw.bankNamePlaceholder} value={bankName} disabled={!isNew} onChange={(e) => setBankName(e.target.value)}/>
      )}
      {transferType === 'kg' && (
        <TextField label={ru.withdraw.bicLabel} placeholder={ru.withdraw.bicPlaceholder} value={bic} disabled={!isNew} onChange={(e) => setBic(e.target.value)}/>
      )}
      {transferType === 'ru' && (
        <TextField label={ru.withdraw.bankBicLabel} placeholder={ru.withdraw.bicPlaceholder} value={bic} disabled={!isNew} onChange={(e) => setBic(e.target.value)}/>
      )}
      {transferType === 'ru' && (
        <TextField label={ru.withdraw.correspondentAccountLabel} placeholder={ru.withdraw.correspondentAccountPlaceholder} value={corrAccount} disabled={!isNew} onChange={(e) => setCorrAccount(e.target.value)}/>
      )}
      <TextField
        label={ru.withdraw.recipientAccountLabel}
        placeholder={ru.withdraw.recipientAccountPlaceholder}
        value={account}
        error={accountError}
        disabled={!isNew}
        onChange={(e) => setAccount(e.target.value)}
      />

      {isNew && (
        <Checkbox checked={saveForLater} onChange={setSaveForLater} label={ru.withdraw.saveRequisiteLabel}/>
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
      </div>

      <div className="withdraw-requisites__submit button-row">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{ru.withdraw.cancelAction}</Button>
        <Button loading={submitting} disabled={!account.trim()} onClick={handleConfirm}>{ru.withdraw.confirmAction}</Button>
      </div>

      <TwoFactorGate
        open={authenticatorOpen}
        authenticatorEnabled={authenticatorEnabled}
        email={session?.email ?? ''}
        onClose={() => setAuthenticatorOpen(false)}
        onSubmit={handleOtpSubmit}
        onResend={handleOtpResend}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
