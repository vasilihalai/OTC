import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';
import { StatusHero } from '@/components/StatusHero/StatusHero.tsx';
import { BalanceBlock } from '@/components/BalanceBlock/BalanceBlock.tsx';
import { Callout } from '@/components/Callout/Callout.tsx';
import { RequisitesPanel } from '@/components/RequisitesPanel/RequisitesPanel.tsx';
import { DocumentRow } from '@/components/DocumentRow/DocumentRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import {
  confirmDeal,
  declineDeal,
  getDealById,
  getRequisites,
  requestNewRate,
} from '@/api/index.ts';
import type { Deal, Requisites } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { useToastStore } from '@/store/toast.ts';
import { DEAL_STATUS_META, getDocumentAvailability, isConfirmationStatus } from '@/lib/dealStatus.ts';
import { computeScenarioBalance, getMinDealAmount, isBalanceScenario, parseAmountValue } from '@/lib/balanceScenario.ts';
import { formatAmount, parseAmountWithTicker } from '@/lib/money.ts';
import { renderTemplate } from '@/lib/template.tsx';
import { openExternalLink } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

import './DealDetail.css';

const DIRECTION_LABEL: Record<Deal['direction'], string> = {
  BUY: ru.deals.directionBuy,
  SELL: ru.deals.directionSell,
  EXCHANGE: ru.deals.directionExchange,
};

// openLink (Telegram SDK) requires an absolute URL — BASE_URL alone is root-relative.
const SAMPLE_DOCUMENT_URL = new URL(`${import.meta.env.BASE_URL}documents/sample.pdf`, window.location.origin).toString();

function openDocument() {
  openExternalLink(SAMPLE_DOCUMENT_URL);
}

export function DealDetail() {
  useRequireSession();
  const { id } = useParams();
  const [deal, setDeal] = useState<Deal>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    setLoading(true);
    setNotFound(false);
    void getDealById(id).then((data) => {
      if (data) {
        setDeal(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="deal-detail">
        <p className="deal-detail__not-found">{ru.dealDetail.notFound}</p>
      </div>
    );
  }

  const meta = deal && DEAL_STATUS_META[deal.status];
  const docs = deal && getDocumentAvailability(deal.status);

  return (
    <div className="deal-detail">
      <div className="deal-detail__header">
        {loading ? <Skeleton width={120} height={26}/> : <h1 className="deal-detail__id">{deal?.id}</h1>}
        {deal && meta && <StatusChip tone={meta.tone}>{meta.detailLabel}</StatusChip>}
      </div>
      {deal && <p className="deal-detail__direction">{DIRECTION_LABEL[deal.direction]}</p>}

      {loading && (
        <Panel surface="card">
          <Skeleton height={90} radius={14}/>
        </Panel>
      )}

      {deal && (isConfirmationStatus(deal.status)
        ? <ConfirmationBody deal={deal} onUpdate={setDeal}/>
        : <StatusHeroBody deal={deal} onUpdate={setDeal}/>)}

      {deal && (
        <Panel heading={ru.dealDetail.detailsTitle}>
          <KeyValueRow label={ru.dealDetail.createdDateLabel} value={deal.date}/>
          <KeyValueRow label={ru.dealDetail.directionLabel} value={DIRECTION_LABEL[deal.direction]}/>
          <KeyValueRow label={ru.dealDetail.giveLabel} value={deal.from}/>
          <KeyValueRow label={ru.dealDetail.receiveLabel} value={deal.to ?? ru.common.tbd}/>
          <KeyValueRow
            label={ru.dealDetail.rateLabel}
            value={deal.status === 'RATE_PENDING' || deal.status === 'RATE_STALE' ? ru.common.tbd : (deal.rate ?? ru.common.tbd)}
          />
        </Panel>
      )}

      {docs && (
        <Panel heading={ru.dealDetail.documentsTitle}>
          <DocumentRow
            name={ru.dealDetail.documentAccept}
            enabled={docs.accept}
            caption={docs.showCaption ? ru.dealDetail.documentUnavailableCaption : undefined}
            onOpen={openDocument}
          />
          <DocumentRow
            name={ru.dealDetail.documentPayment}
            enabled={docs.payment}
            caption={docs.showCaption ? ru.dealDetail.documentUnavailableCaption : undefined}
            onOpen={openDocument}
          />
          <DocumentRow
            name={ru.dealDetail.documentCertificate}
            enabled={docs.certificate}
            caption={docs.showCaption ? ru.dealDetail.documentUnavailableCaption : undefined}
            onOpen={openDocument}
          />
        </Panel>
      )}
    </div>
  );
}

type Branch = 'sufficient' | 'short1' | 'short' | 'belowmin';

function ConfirmationBody({ deal, onUpdate }: { deal: Deal; onUpdate: (deal: Deal) => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlScenario = searchParams.get('scenario');
  const storeScenario = useUiStore((s) => s.balanceScenario);
  const cycleScenario = useUiStore((s) => s.cycleBalanceScenario);
  const scenario = isBalanceScenario(urlScenario) ? urlScenario : storeScenario;
  const [requisites, setRequisites] = useState<Requisites>();
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  useEffect(() => {
    void getRequisites(deal.id).then(setRequisites);
  }, [deal.id]);

  const dealAmount = parseAmountValue(deal.from);
  const balance = computeScenarioBalance(dealAmount, deal.ticker, scenario);
  const minDeal = getMinDealAmount(deal.ticker);

  let branch: Branch;
  if (balance >= dealAmount) {
    branch = 'sufficient';
  } else if (balance < minDeal) {
    branch = 'belowmin';
  } else if ((dealAmount - balance) / dealAmount <= 0.01) {
    branch = 'short1';
  } else {
    branch = 'short';
  }

  const balanceLabel = `${formatAmount(String(balance), deal.ticker)} ${deal.ticker}`;
  const minLabel = `${formatAmount(String(minDeal), deal.ticker)} ${deal.ticker}`;
  const counter = deal.to ? parseAmountWithTicker(deal.to) : undefined;
  const recalculated = counter
    ? `${formatAmount(String((balance / dealAmount) * counter.value), counter.ticker)} ${counter.ticker}`
    : balanceLabel;

  async function handleConfirm() {
    setConfirming(true);
    try {
      const updated = await confirmDeal(deal.id);
      if (updated) {
        onUpdate(updated);
      }
    } finally {
      setConfirming(false);
    }
  }

  async function handleDecline() {
    setDeclineDialogOpen(false);
    setDeclining(true);
    try {
      const updated = await declineDeal(deal.id);
      if (updated) {
        onUpdate(updated);
      }
    } finally {
      setDeclining(false);
    }
  }

  return (
    <>
      <BalanceBlock
        balance={formatAmount(String(balance), deal.ticker)}
        ticker={deal.ticker}
        dealAmount={deal.from}
        shortfall={branch !== 'sufficient' ? `${formatAmount(String(dealAmount - balance), deal.ticker)} ${deal.ticker}` : undefined}
        onTransfer={() => navigate('/transfer')}
        onLongPressBalance={cycleScenario}
      />

      {branch === 'sufficient' && <Callout variant="neutral">{ru.dealDetail.calloutSufficient}</Callout>}
      {branch === 'short1' && (
        <Callout variant="danger">
          {renderTemplate(ru.dealDetail.calloutShort1, { balance: balanceLabel, recalculated })}
        </Callout>
      )}
      {branch === 'short' && (
        <Callout variant="danger">
          {renderTemplate(ru.dealDetail.calloutShort, { balance: balanceLabel })}
        </Callout>
      )}
      {branch === 'belowmin' && (
        <Callout variant="danger">
          {renderTemplate(ru.dealDetail.calloutBelowMin, { min: minLabel })}
        </Callout>
      )}

      <Button loading={confirming} disabled={branch === 'belowmin'} onClick={() => void handleConfirm()}>
        {ru.dealDetail.confirmDealAction}
      </Button>
      <Button
        type="button"
        variant="link"
        className="deal-detail__decline"
        loading={declining}
        onClick={() => setDeclineDialogOpen(true)}
      >
        {ru.dealDetail.declineAction}
      </Button>

      {branch !== 'sufficient' && requisites && <RequisitesPanel requisites={requisites}/>}

      <ConfirmDialog
        open={declineDialogOpen}
        title={ru.dealDetail.declineConfirmTitle}
        onConfirm={() => void handleDecline()}
        onCancel={() => setDeclineDialogOpen(false)}
      />
    </>
  );
}

function StatusHeroBody({ deal, onUpdate }: { deal: Deal; onUpdate: (deal: Deal) => void }) {
  const show = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  async function handleRequestNewRate() {
    setBusy(true);
    try {
      const updated = await requestNewRate(deal.id);
      if (updated) {
        onUpdate(updated);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setCancelDialogOpen(false);
    setBusy(true);
    try {
      const updated = await declineDeal(deal.id);
      if (updated) {
        onUpdate(updated);
      }
    } finally {
      setBusy(false);
    }
  }

  switch (deal.status) {
    case 'RATE_PENDING':
      return (
        <>
          <StatusHero
            icon="spinner"
            tone="running"
            title={ru.dealDetail.heroRatePendingTitle}
            subtitle={ru.dealDetail.heroRatePendingSubtitle}
            action={(
              <Button
                type="button"
                variant="link"
                loading={busy}
                onClick={() => setCancelDialogOpen(true)}
              >
                {ru.dealDetail.cancelRequestAction}
              </Button>
            )}
          />
          <ConfirmDialog
            open={cancelDialogOpen}
            title={ru.dealDetail.cancelRequestConfirmTitle}
            onConfirm={() => void handleCancel()}
            onCancel={() => setCancelDialogOpen(false)}
          />
        </>
      );
    case 'RATE_STALE':
      return (
        <StatusHero
          icon="hourglass"
          tone="stale"
          title={ru.dealDetail.heroRateStaleTitle}
          action={<Button loading={busy} onClick={() => void handleRequestNewRate()}>{ru.dealDetail.requestNewRateAction}</Button>}
        />
      );
    case 'RUNNING':
      return (
        <StatusHero
          icon="spinner"
          tone="running"
          title={ru.dealDetail.heroRunningTitle}
          subtitle={renderTemplate(ru.dealDetail.heroRunningSubtitle, { amount: deal.from })}
        />
      );
    case 'DONE':
      return (
        <StatusHero
          icon="check"
          tone="success"
          title={ru.dealDetail.heroDoneTitle}
          subtitle={renderTemplate(ru.dealDetail.heroDoneSubtitle, { amount: deal.to ?? deal.from })}
          action={<Button type="button" variant="link" onClick={() => show(ru.stub.inDevelopment)}>{ru.dealDetail.historyAction}</Button>}
        />
      );
    case 'DECLINED':
      return (
        <StatusHero
          icon="cross"
          tone="danger"
          title={ru.dealDetail.heroDeclinedTitle}
          subtitle={ru.dealDetail.heroDeclinedSubtitle}
        />
      );
    default:
      return null;
  }
}
