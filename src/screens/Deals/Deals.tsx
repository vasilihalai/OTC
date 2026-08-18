import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { DealRow } from '@/components/DealRow/DealRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { getDeals } from '@/api/index.ts';
import type { Deal, DealDirection, DealStatus } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { ru } from '@/i18n/ru.ts';

import './Deals.css';

type StatusFilter = 'ALL' | DealStatus;
type DirectionFilter = 'ALL' | DealDirection;

export function Deals() {
  const navigate = useNavigate();
  useRequireSession();
  const [deals, setDeals] = useState<Deal[]>();
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');

  async function load() {
    setError(false);
    try {
      setDeals(await getDeals());
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredDeals = (deals ?? []).filter(
    (deal) =>
      (statusFilter === 'ALL' || deal.status === statusFilter)
      && (directionFilter === 'ALL' || deal.direction === directionFilter),
  );

  return (
    <div className="deals">
      <div className="deals__filters">
        <div className="deals__filter-row">
          <span className="deals__filter-label">{ru.deals.filterStatusLabel}</span>
          <SegmentedControl
            options={[
              { value: 'ALL' as const, label: ru.deals.filterAll },
              { value: 'DONE' as const, label: ru.deals.statusDone },
              { value: 'RUNNING' as const, label: ru.deals.statusRunning },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        <div className="deals__filter-row">
          <span className="deals__filter-label">{ru.deals.filterDirectionLabel}</span>
          <SegmentedControl
            options={[
              { value: 'ALL' as const, label: ru.deals.filterAll },
              { value: 'BUY' as const, label: ru.deals.directionBuy },
              { value: 'SELL' as const, label: ru.deals.directionSell },
              { value: 'EXCHANGE' as const, label: ru.deals.directionExchange },
            ]}
            value={directionFilter}
            onChange={setDirectionFilter}
          />
        </div>
      </div>

      <Panel heading={ru.deals.title}>
        {error && (
          <div className="deals__error">
            <p>{ru.common.errorGeneric}</p>
            <Button variant="social" onClick={() => void load()}>{ru.common.retryAction}</Button>
          </div>
        )}
        {!error && deals && deals.length === 0 && <p className="deals__empty">{ru.home.noDeals}</p>}
        {!error && deals && deals.length > 0 && filteredDeals.length === 0 && (
          <p className="deals__empty">{ru.deals.noResults}</p>
        )}
        {!error && filteredDeals.map((deal) => (
          <DealRow key={deal.id} deal={deal} onClick={() => navigate(`/deals/${deal.id}`)}/>
        ))}
      </Panel>
    </div>
  );
}
