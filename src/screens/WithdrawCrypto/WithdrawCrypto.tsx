import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { AmountField } from '@/components/AmountField/AmountField.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { WarningPanel } from '@/components/WarningPanel/WarningPanel.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { TwoFactorGate } from '@/components/TwoFactorGate/TwoFactorGate.tsx';
import { QrScannerModal } from '@/components/QrScannerModal/QrScannerModal.tsx';
import {
  ApiError,
  confirmWithdrawOtp,
  getAssets,
  getWithdrawCryptoOptions,
  getWithdrawCryptoQuote,
  issueWithdrawOtp,
  mapApiError,
} from '@/api/index.ts';
import type { Asset, CryptoWithdrawOptions, WithdrawOtpSource, WithdrawQuote } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { useTransferModalStore } from '@/store/transferModal.ts';
import { formatAmount } from '@/lib/money.ts';
import { RateLimitedError } from '@/lib/rateLimitedError.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawCrypto.css';

const QUOTE_DEBOUNCE_MS = 500;

function QrIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 12h2.5v2.5H12zM16 12h1.5v1.5M16 16h1.5v1.5M12 16h1.5v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

/** §5.1: "addressRegex drives client-side address validation ... treat a malformed regex as 'no client validation' rather than crashing the screen." */
function compileAddressRegex(pattern: string | null | undefined): RegExp | undefined {
  if (!pattern) {
    return undefined;
  }
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
}

/** §5.2: "Show the smallest availableLimit across the returned periods ... render its currency." Not guaranteed which periods exist. */
function smallestLimit(quote: WithdrawQuote | undefined): { availableLimit: string; currency: string } | undefined {
  const entries = Object.values(quote?.limits ?? {});
  if (entries.length === 0) {
    return undefined;
  }
  return entries.reduce((min, entry) => (Number(entry.availableLimit) < Number(min.availableLimit) ? entry : min));
}

export function WithdrawCrypto() {
  const session = useRequireSession();
  const navigate = useNavigate();
  const openTransferModal = useTransferModalStore((s) => s.open);
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('asset');
  const bumpBalancesVersion = useUiStore((s) => s.bumpBalancesVersion);
  const balancesVersion = useUiStore((s) => s.balancesVersion);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [ticker, setTicker] = useState(preselected ?? '');
  const [options, setOptions] = useState<CryptoWithdrawOptions>();
  const [networkId, setNetworkId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState<string>();
  const [qrOpen, setQrOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [quote, setQuote] = useState<WithdrawQuote>();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpSource, setOtpSource] = useState<WithdrawOtpSource>('email');

  const address = manualAddress.trim();

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
      setNetworkId(data.networks[0]?.currencyNetworkId ?? '');
      setManualAddress('');
      setAmount('');
      setQuote(undefined);
    });
  }, [ticker]);

  const asset = assets.find((a) => a.ticker === ticker);
  const available = asset?.balance ?? '0';
  const selectedNetwork = options?.networks.find((n) => n.currencyNetworkId === networkId);
  const addressRegex = useMemo(() => compileAddressRegex(selectedNetwork?.addressRegex), [selectedNetwork?.addressRegex]);

  // §5.2 — a fresh quote whenever what would change its numbers changes.
  // Debounced so typing an amount doesn't fire a request per keystroke.
  useEffect(() => {
    if (!ticker || !networkId || !address || !amount || Number(amount) <= 0) {
      setQuote(undefined);
      return;
    }
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      void getWithdrawCryptoQuote({ currency: ticker, currencyNetworkId: networkId, amount, address })
        .then(setQuote)
        .catch((err) => {
          setQuote(undefined);
          setAmountError(err instanceof ApiError ? mapApiError(err) : ru.withdraw.errorGeneric);
        })
        .finally(() => setQuoteLoading(false));
    }, QUOTE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      setQuoteLoading(false);
    };
  }, [ticker, networkId, address, amount]);

  // §5.2: "expiredAt means the quote goes stale. Re-request withdraw/info if
  // the user sits on the screen past it, and disable submit in the meantime."
  useEffect(() => {
    if (!quote?.expiredAt) {
      return;
    }
    const msLeft = new Date(quote.expiredAt).getTime() - Date.now();
    if (msLeft <= 0) {
      setQuote(undefined);
      return;
    }
    const timer = setTimeout(() => setQuote(undefined), msLeft);
    return () => clearTimeout(timer);
  }, [quote?.expiredAt]);

  function handleMax() {
    setAmount(available);
    setAmountError(undefined);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    setAmountError(value && Number(value) > Number(available) ? ru.withdraw.errorInsufficientFunds : undefined);
  }

  function handleAddressChange(value: string) {
    setManualAddress(value);
    setAddressError(undefined);
  }

  function handleAddressBlur() {
    if (address && addressRegex && !addressRegex.test(address)) {
      setAddressError(ru.withdraw.errorAddressInvalid);
    }
  }

  function handleTickerChange(value: string) {
    setTicker(value);
    setManualAddress('');
    setAmount('');
  }

  function handleQrScan(scanned: string) {
    setManualAddress(scanned);
    setAddressError(undefined);
    setQrOpen(false);
  }

  const canConfirm = !!quote && !quoteLoading;

  async function handleConfirm() {
    setAddressError(undefined);
    setAmountError(undefined);
    if (!address) {
      setAddressError(ru.withdraw.errorAddressRequired);
      notifyError();
      return;
    }
    if (addressRegex && !addressRegex.test(address)) {
      setAddressError(ru.withdraw.errorAddressInvalid);
      notifyError();
      return;
    }
    if (!quote) {
      notifyError();
      return;
    }
    if (Number(amount) < Number(quote.minimalAmount)) {
      setAmountError(ru.withdraw.errorBelowMin);
      notifyError();
      return;
    }
    if (Number(amount) > Number(available)) {
      setAmountError(ru.withdraw.errorAboveAvailable);
      notifyError();
      return;
    }

    // §5.2: "options.confirmation2FA/confirmationEmail tell you which second
    // factor this specific operation needs — prefer them over the account-
    // level twoFA when present." The authoritative answer is issue-otp's own
    // `source`, requested right before opening the modal.
    setSubmitting(true);
    try {
      const otp = await issueWithdrawOtp(quote.transactionId, session!.clientType);
      setOtpSource(otp.source);
      setOtpOpen(true);
    } catch (err) {
      notifyError();
      setAmountError(err instanceof ApiError ? mapApiError(err) : ru.withdraw.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(code: string) {
    if (!quote) {
      throw new Error(ru.withdraw.errorGeneric);
    }
    try {
      await confirmWithdrawOtp(quote.transactionId, code, { address });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.httpStatus === 429) {
          throw new RateLimitedError();
        }
        throw new Error(mapApiError(err));
      }
      throw err;
    }
  }

  async function handleOtpResend() {
    if (!quote) {
      return;
    }
    const otp = await issueWithdrawOtp(quote.transactionId, session!.clientType);
    setOtpSource(otp.source);
  }

  function handleOtpVerified() {
    setOtpOpen(false);
    bumpBalancesVersion();
    setSuccess(true);
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
        <Skeleton height={48} radius={12}/>
        <Skeleton height={48} radius={12}/>
        <Panel fill="surface" radius="12px">
          <Skeleton height={100} radius={8}/>
        </Panel>
      </div>
    );
  }

  const limit = smallestLimit(quote);

  return (
    <div className="withdraw-crypto">
      <div className="withdraw-crypto__scroll">
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
        </div>
        <div className="withdraw-crypto__address-manual">
          <TextField
            label=""
            placeholder={ru.withdraw.addressPlaceholder}
            value={manualAddress}
            error={addressError}
            onChange={(ev) => handleAddressChange(ev.target.value)}
            onBlur={handleAddressBlur}
            suffix={(
              <button
                type="button"
                className="withdraw-crypto__qr-button"
                onClick={() => setQrOpen(true)}
                aria-label={ru.withdraw.qrScannerTitle}
              >
                <QrIcon/>
              </button>
            )}
          />
        </div>
        {/* §5.1: hide the selector when there's exactly one network — this now falls out naturally from the real network list length, not a hardcoded BTC check. */}
        {options && options.networks.length > 1 && (
          <Select
            label={ru.withdraw.networkLabel}
            layout="plain"
            options={options.networks.map((n) => ({ value: n.currencyNetworkId, label: n.networkLabel }))}
            value={networkId}
            onChange={setNetworkId}
          />
        )}

        <h2 className="withdraw-crypto__section-title">{ru.withdraw.amountSectionTitle}</h2>
        <AmountField
          label={ru.withdraw.sendLabel}
          availableLabel={ru.withdraw.balanceLabel}
          available={formatAmount(available, ticker)}
          value={amount}
          onChange={handleAmountChange}
          onMax={handleMax}
          maxLabel={ru.withdraw.maxAction}
          error={amountError}
          onTransfer={openTransferModal}
        />

        {quote && (
          <SummaryCard
            rows={[
              { key: 'min', label: ru.withdraw.minAmountLabel, value: `${formatAmount(quote.minimalAmount, ticker)} ${ticker}` },
              ...(limit
                ? [{ key: 'limit', label: ru.withdraw.limitLabel, value: `${formatAmount(limit.availableLimit, limit.currency)} ${limit.currency}` }]
                : []),
              ...(quote.contractAddress
                ? [{
                  key: 'contract',
                  label: ru.withdraw.contractAddressLabel,
                  value: ru.withdraw.contractTailPrefixText,
                  tail: quote.contractAddress.slice(-8),
                }]
                : []),
              { key: 'fee', label: ru.withdraw.feeLabel, value: `${formatAmount(quote.commission, ticker)} ${ticker}` },
            ]}
            totalLabel={ru.withdraw.payoutLabel}
            totalValue={`${formatAmount(quote.finalAmount, ticker)} ${ticker}`}
            caption={ru.withdraw.payoutCaption}
          />
        )}

        <WarningPanel body={ru.withdraw.cryptoWarning}/>
      </div>

      <div className="withdraw-crypto__submit">
        <Button variant="accent" loading={submitting || quoteLoading} disabled={!canConfirm} onClick={() => void handleConfirm()}>
          {ru.withdraw.confirmAction}
        </Button>
      </div>

      <TwoFactorGate
        open={otpOpen}
        authenticatorEnabled={otpSource === 'authenticator'}
        email={session?.email ?? ''}
        onClose={() => setOtpOpen(false)}
        onSubmit={handleOtpSubmit}
        onResend={handleOtpResend}
        onVerified={handleOtpVerified}
      />
      <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} onScan={handleQrScan}/>
    </div>
  );
}
