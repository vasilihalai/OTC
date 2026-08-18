import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { DealRow } from '@/components/DealRow/DealRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { Modal } from '@/components/Modal/Modal.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getDeals } from '@/api/index.ts';
import type { Deal, DealDirection, DealStatus } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { isToday, isWithinLastDays } from '@/lib/date.ts';
import { ru } from '@/i18n/ru.ts';

import './Deals.css';

type StatusFilter = 'ALL' | DealStatus;
type DirectionFilter = 'ALL' | DealDirection;
type PeriodFilter = 'ALL' | 'TODAY' | '7D' | '30D';

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

export function Deals() {
  const navigate = useNavigate();
  useRequireSession();
  const [deals, setDeals] = useState<Deal[]>();
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  function matchesPeriod(deal: Deal): boolean {
    if (periodFilter === 'ALL') {
      return true;
    }
    if (periodFilter === 'TODAY') {
      return isToday(deal.date);
    }
    if (periodFilter === '7D') {
      return isWithinLastDays(deal.date, 7);
    }
    return isWithinLastDays(deal.date, 30);
  }

  const filteredDeals = (deals ?? []).filter(
    (deal) =>
      (statusFilter === 'ALL' || deal.status === statusFilter)
      && (directionFilter === 'ALL' || deal.direction === directionFilter)
      && matchesPeriod(deal),
  );

  const activeFilterCount = [statusFilter !== 'ALL', directionFilter !== 'ALL', periodFilter !== 'ALL']
    .filter(Boolean).length;

  function resetFilters() {
    setStatusFilter('ALL');
    setDirectionFilter('ALL');
    setPeriodFilter('ALL');
  }

  return (
    <div className="deals">
      <div className="deals__toolbar">
        <h1 className="deals__title">{ru.deals.title}</h1>
        <button type="button" className="deals__filters-button" onClick={() => setFiltersOpen(true)}>
          <FilterIcon/>
          {ru.deals.filtersAction}
          {activeFilterCount > 0 && <span className="deals__filters-badge">{activeFilterCount}</span>}
        </button>
      </div>

      <Panel>
        {error && (
          <div className="deals__error">
            <p>{ru.common.errorGeneric}</p>
            <Button variant="social" onClick={() => void load()}>{ru.common.retryAction}</Button>
          </div>
        )}

        {!error && !deals && (
          <div className="deals__skeleton">
            <Skeleton height={90} radius={12}/>
            <Skeleton height={90} radius={12}/>
            <Skeleton height={90} radius={12}/>
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

      <Modal open={filtersOpen} title={ru.deals.filtersTitle} onClose={() => setFiltersOpen(false)}>
        <div className="deals__filter-field">
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
        <div className="deals__filter-field">
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
        <div className="deals__filter-field">
          <span className="deals__filter-label">{ru.deals.filterPeriodLabel}</span>
          <SegmentedControl
            options={[
              { value: 'ALL' as const, label: ru.deals.periodAll },
              { value: 'TODAY' as const, label: ru.deals.periodToday },
              { value: '7D' as const, label: ru.deals.period7d },
              { value: '30D' as const, label: ru.deals.period30d },
            ]}
            value={periodFilter}
            onChange={setPeriodFilter}
          />
        </div>
        <div className="deals__filter-actions">
          <Button onClick={() => setFiltersOpen(false)}>{ru.deals.filtersApply}</Button>
          <Button type="button" variant="link" onClick={resetFilters}>{ru.deals.filtersReset}</Button>
        </div>
      </Modal>
    </div>
  );
}
