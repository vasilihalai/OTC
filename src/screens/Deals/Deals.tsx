import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { DealRow } from '@/components/DealRow/DealRow.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { getDeals } from '@/api/index.ts';
import type { Deal } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { ru } from '@/i18n/ru.ts';

import './Deals.css';

export function Deals() {
  const navigate = useNavigate();
  useRequireSession();
  const [deals, setDeals] = useState<Deal[]>();
  const [error, setError] = useState(false);

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

  return (
    <div className="deals">
      <Panel heading={ru.deals.title}>
        {error && (
          <div className="deals__error">
            <p>{ru.common.errorGeneric}</p>
            <Button variant="social" onClick={() => void load()}>{ru.common.retryAction}</Button>
          </div>
        )}
        {!error && deals && deals.length === 0 && <p className="deals__empty">{ru.home.noDeals}</p>}
        {!error && deals?.map((deal) => (
          <DealRow key={deal.id} deal={deal} onClick={() => navigate(`/deals/${deal.id}`)}/>
        ))}
      </Panel>
    </div>
  );
}
