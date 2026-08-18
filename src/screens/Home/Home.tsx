import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/Panel/Panel.tsx';
import { StatCard } from '@/components/StatCard/StatCard.tsx';
import { CompanyChip } from '@/components/CompanyChip/CompanyChip.tsx';
import { DealRow } from '@/components/DealRow/DealRow.tsx';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl.tsx';
import { AssetRow } from '@/components/AssetRow/AssetRow.tsx';
import { getAssets, getDeals, getStats, getUser } from '@/api/index.ts';
import type { Asset, Deal, Stats, User } from '@/api/index.ts';
import { useRequireSession } from '@/store/session.ts';
import { useUiStore } from '@/store/ui.ts';
import { formatAmount } from '@/lib/money.ts';
import { ru } from '@/i18n/ru.ts';

import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const session = useRequireSession();
  const clientType = session?.clientType ?? 'FL';
  const selectedGroup = useUiStore((s) => s.selectedAssetGroup);
  const setSelectedGroup = useUiStore((s) => s.setSelectedAssetGroup);

  const [user, setUser] = useState<User>();
  const [stats, setStats] = useState<Stats>();
  const [deals, setDeals] = useState<Deal[]>();
  const [assets, setAssets] = useState<Asset[]>();
  const [assetsLoading, setAssetsLoading] = useState(true);

  const load = useCallback(async () => {
    const [userData, statsData, dealsData] = await Promise.all([
      getUser(clientType),
      getStats(),
      getDeals(),
    ]);
    setUser(userData);
    setStats(statsData);
    setDeals(dealsData);
  }, [clientType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAssetsLoading(true);
    void getAssets(selectedGroup).then((data) => {
      setAssets(data);
      setAssetsLoading(false);
    });
  }, [selectedGroup]);

  const positiveAssets = (assets ?? []).filter((a) => Number(a.balance) > 0);
  const hiddenZeroBalance = (assets ?? []).length > positiveAssets.length;

  return (
    <div className="home">
      <Panel>
        <h1 className="home__hero-title">{ru.home.heroTitle}</h1>
        <p className="home__hero-subtitle">{ru.home.heroSubtitle}</p>
        <p className="home__desk-hours">{ru.home.deskHours}</p>
        {user && <CompanyChip>{user.clientName}</CompanyChip>}
        {stats && (
          <div className="home__stats">
            <StatCard value={String(stats.activeDeals)} label={ru.home.statActiveDeals}/>
            <StatCard value={stats.volume30d} unit={stats.volumeAsset} label={ru.home.statVolume30d}/>
          </div>
        )}
      </Panel>

      <Panel heading={ru.home.recentDealsTitle}>
        {deals && deals.length === 0 && <p className="home__empty">{ru.home.noDeals}</p>}
        {deals?.slice(0, 3).map((deal) => (
          <DealRow key={deal.id} deal={deal} onClick={() => navigate(`/deals/${deal.id}`)}/>
        ))}
      </Panel>

      <Panel heading={ru.home.depositAccountTitle}>
        <SegmentedControl
          options={[
            { value: 'crypto', label: ru.home.segmentCrypto },
            { value: 'fiat', label: ru.home.segmentFiat },
          ]}
          value={selectedGroup}
          onChange={setSelectedGroup}
        />
        <div className="home__assets">
          {!assetsLoading && positiveAssets.length === 0 && (
            <p className="home__empty">{ru.home.noPositiveBalance}</p>
          )}
          {positiveAssets.map((asset) => (
            <AssetRow
              key={asset.ticker}
              ticker={asset.ticker}
              name={asset.name}
              amount={formatAmount(asset.balance, asset.ticker)}
              onWithdraw={() => navigate(`/withdraw/${asset.ticker}`)}
            />
          ))}
        </div>
        {hiddenZeroBalance && <p className="home__hidden-caption">{ru.home.hiddenZeroBalance}</p>}
      </Panel>
    </div>
  );
}
