import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { DealRow } from '@/components/DealRow/DealRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { FilterChips } from '@/components/FilterChips/FilterChips.tsx';
import { Skeleton } from '@/components/Skeleton/Skeleton.tsx';
import { getDeals } from '@/api/index.ts';
import type { Deal } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { type DealFilter, matchesFilter } from '@/lib/dealStatus.ts';
import { ru } from '@/i18n/ru.ts';

import './Deals.css';

export function Deals() {
  const navigate = useNavigate();
  useRequireSession();
  const [deals, setDeals] = useState<Deal[]>();
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<DealFilter>('ALL');

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

  const filteredDeals = (deals ?? []).filter((deal) => matchesFilter(deal.status, filter));

  return (
    <div className="deals">
      <h1 className="deals__title">{ru.deals.title}</h1>

      <FilterChips
        options={[
          { value: 'ALL' as const, label: ru.deals.filterAll },
          { value: 'ACTIVE' as const, label: ru.deals.filterActive },
          { value: 'DONE' as const, label: ru.deals.filterDone },
          { value: 'DECLINED' as const, label: ru.deals.filterDeclined },
        ]}
        value={filter}
        onChange={setFilter}
      />

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
          <div className="deals__empty-filtered">
            <p className="deals__empty">{ru.deals.emptyForFilter}</p>
            <Button type="button" variant="link" onClick={() => setFilter('ALL')}>{ru.deals.showAllAction}</Button>
          </div>
        )}
        {!error && filteredDeals.map((deal) => (
          <DealRow key={deal.id} deal={deal} onClick={() => navigate(`/deals/${deal.id}`)}/>
        ))}
      </Panel>
    </div>
  );
}
