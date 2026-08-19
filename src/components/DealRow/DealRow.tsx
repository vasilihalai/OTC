import type { Deal } from '@/api/index.ts';
import { StatusChip } from '@/components/StatusChip/StatusChip.tsx';
import { KeyValueRow } from '@/components/KeyValueRow/KeyValueRow.tsx';
import { bem } from '@/css/bem.ts';
import { DEAL_STATUS_META } from '@/lib/dealStatus.ts';
import { ru } from '@/i18n/ru.ts';

import './DealRow.css';

const [b, e] = bem('deal-row');

const DIRECTION_LABEL: Record<Deal['direction'], string> = {
  BUY: ru.deals.directionBuy,
  SELL: ru.deals.directionSell,
  EXCHANGE: ru.deals.directionExchange,
};

export interface DealRowProps {
  deal: Deal;
  onClick: () => void;
}

export function DealRow({ deal, onClick }: DealRowProps) {
  const meta = DEAL_STATUS_META[deal.status];
  return (
    <div className={b({ highlight: deal.status === 'RATE_ACTIVE' })} onClick={onClick} role="button" tabIndex={0}>
      <div className={e('top')}>
        <span className={e('id')}>
          {deal.id}
          {' '}
          <StatusChip tone={deal.status} size="sm">{meta.listLabel}</StatusChip>
        </span>
        <span className={e('date')}>{deal.date}</span>
      </div>
      <KeyValueRow label={ru.deals.direction} value={DIRECTION_LABEL[deal.direction]}/>
      <KeyValueRow label={ru.deals.give} value={deal.from}/>
      <KeyValueRow label={ru.deals.receive} value={deal.to ?? ru.deals.receiveTbd}/>
    </div>
  );
}
