import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { Select } from '@/components/Select/Select.tsx';
import { TextField } from '@/components/TextField/TextField.tsx';
import { AmountField } from '@/components/AmountField/AmountField.tsx';
import { SummaryCard } from '@/components/SummaryCard/SummaryCard.tsx';
import { CurrencyIcon } from '@/components/CurrencyIcon/CurrencyIcon.tsx';
import { WarningPanel } from '@/components/WarningPanel/WarningPanel.tsx';
import { HelpTip } from '@/components/HelpTip/HelpTip.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { TwoFactorGate } from '@/components/TwoFactorGate/TwoFactorGate.tsx';
import { QrScannerModal } from '@/components/QrScannerModal/QrScannerModal.tsx';
import { getAssets, getUser, getWithdrawCryptoOptions, submitCryptoWithdrawal } from '@/api/index.ts';
import type { Asset, CryptoWithdrawOptions } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { useTransferModalStore } from '@/store/transferModal.ts';
import { formatAmount } from '@/lib/money.ts';
import { notifyError } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './WithdrawCrypto.css';

const NEW_ADDRESS_OPTION = '__new__';

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
  const [addressChoice, setAddressChoice] = useState(NEW_ADDRESS_OPTION);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState<string>();
  const [qrOpen, setQrOpen] = useState(false);
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authenticatorOpen, setAuthenticatorOpen] = useState(false);
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (session) {
      void getUser(session.clientType).then((user) => setAuthenticatorEnabled(user.authenticatorEnabled));
    }
  }, [session]);

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
      setAddressChoice(data.addresses[0]?.id ?? NEW_ADDRESS_OPTION);
      setManualAddress('');
    });
  }, [ticker]);

  const asset = assets.find((a) => a.ticker === ticker);
  const available = asset?.balance ?? '0';
  const selectedSavedAddress = options?.addresses.find((a) => a.id === addressChoice);
  const isManualAddress = !selectedSavedAddress;
  const address = isManualAddress ? manualAddress.trim() : selectedSavedAddress.address;
  // Every network the asset supports is always selectable here — the network
  // is independent of which saved address is picked (filtering it down to
  // only the networks the selected address happens to support was hiding
  // the choice entirely whenever that address only listed one, e.g. USDT
  // defaulting to a saved ERC-20-only address hid TRC-20 completely).
  const compatibleNetworks = options?.networks ?? [];
  const isBtc = ticker === 'BTC';

  // Keeps the network selection valid whenever the options change — a stale
  // value would otherwise leave the Select unable to match any option.
  useEffect(() => {
    if (compatibleNetworks.length > 0 && !compatibleNetworks.includes(network)) {
      setNetwork(compatibleNetworks[0]);
    }
  }, [options]);

  function handleMax() {
    setAmount(available);
    setAmountError(undefined);
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    setAmountError(value && Number(value) > Number(available) ? ru.withdraw.errorInsufficientFunds : undefined);
  }

  function handleTickerChange(value: string) {
    setTicker(value);
    setAddressChoice(NEW_ADDRESS_OPTION);
    setManualAddress('');
    setNetwork('');
  }

  function handleQrScan(scanned: string) {
    setManualAddress(scanned);
    setAddressError(undefined);
    setQrOpen(false);
  }

  const canConfirm = !!options;

  function handleConfirm() {
    setAddressError(undefined);
    setAmountError(undefined);
    if (!address) {
      setAddressError(ru.withdraw.errorAddressRequired);
      notifyError();
      return;
    }
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

    setAuthenticatorOpen(true);
  }

  async function handleAuthenticated() {
    setSubmitting(true);
    try {
      await submitCryptoWithdrawal({
        ticker,
        network,
        address,
        amount,
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
        <Panel fill="surface" radius="12px">
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
        {options && options.addresses.length > 0 && (
          <Select
            label=""
            layout="address"
            options={[
              ...options.addresses.map((a) => ({ value: a.id, label: a.address, labels: a.labels })),
              { value: NEW_ADDRESS_OPTION, label: ru.withdraw.newAddressOption },
            ]}
            value={addressChoice}
            onChange={setAddressChoice}
          />
        )}
        {isManualAddress && (
          <div className="withdraw-crypto__address-manual">
            <TextField
              label=""
              placeholder={ru.withdraw.addressPlaceholder}
              value={manualAddress}
              error={addressError}
              onChange={(ev) => { setManualAddress(ev.target.value); setAddressError(undefined); }}
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
        )}
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

        <WarningPanel title={ru.withdraw.warningTitle} body={ru.withdraw.cryptoWarning}/>
      </div>

      <div className="withdraw-crypto__submit">
        <Button variant="accent" disabled={!canConfirm || submitting} onClick={handleConfirm}>
          {ru.withdraw.confirmAction}
        </Button>
      </div>

      <TwoFactorGate
        open={authenticatorOpen}
        authenticatorEnabled={authenticatorEnabled}
        email={session?.email ?? ''}
        onClose={() => setAuthenticatorOpen(false)}
        onVerified={handleAuthenticated}
      />
      <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} onScan={handleQrScan}/>
    </div>
  );
}
