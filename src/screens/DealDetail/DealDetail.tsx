import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getDealById } from '@/api/index.ts';
import type { Deal } from '@/api/index.ts';
import { ru } from '@/i18n/ru.ts';

import './DealDetail.css';

const DIRECTION_LABEL: Record<Deal['direction'], string> = {
  BUY: ru.deals.directionBuy,
  SELL: ru.deals.directionSell,
  EXCHANGE: ru.deals.directionExchange,
};

export function DealDetail() {
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

  return (
    <div className="deal-detail">
      <Panel>
        <div className="deal-detail__header">
          {loading ? <Skeleton width={120} height={22}/> : <h1 className="deal-detail__id">{deal?.id}</h1>}
          {deal && (
            <StatusChip tone={deal.status === 'DONE' ? 'success' : 'info'}>
              {deal.status === 'DONE' ? ru.deals.statusDone : ru.deals.statusRunning}
            </StatusChip>
          )}
        </div>

        {loading ? (
          <Skeleton height={44} radius={8}/>
        ) : (
          <div className="deal-detail__amounts">
            <div className="deal-detail__amount-block">
              <span className="deal-detail__amount-label">{ru.dealDetail.giveLabel}</span>
              <span className="deal-detail__amount-value">{deal?.from}</span>
            </div>
            <div className="deal-detail__arrow" aria-hidden="true">→</div>
            <div className="deal-detail__amount-block">
              <span className="deal-detail__amount-label">{ru.dealDetail.receiveLabel}</span>
              <span className="deal-detail__amount-value">{deal?.to || ru.deals.receiveTbd}</span>
            </div>
          </div>
        )}
      </Panel>

      <Panel surface="card">
        <KeyValueRow label={ru.dealDetail.idLabel} loading={loading} value={deal?.id}/>
        <KeyValueRow
          label={ru.dealDetail.statusLabel}
          loading={loading}
          value={deal && (deal.status === 'DONE' ? ru.deals.statusDone : ru.deals.statusRunning)}
        />
        <KeyValueRow label={ru.dealDetail.dateLabel} loading={loading} value={deal?.date}/>
        <KeyValueRow
          label={ru.dealDetail.directionLabel}
          loading={loading}
          value={deal && DIRECTION_LABEL[deal.direction]}
        />
      </Panel>
    </div>
  );
}
