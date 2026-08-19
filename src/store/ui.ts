import { create } from 'zustand';

import type { AssetGroup, BalanceScenario } from '@/api/index.ts';

const SCENARIOS: BalanceScenario[] = ['sufficient', 'short1', 'short', 'belowmin'];

interface UiStore {
  selectedAssetGroup: AssetGroup;
  setSelectedAssetGroup: (group: AssetGroup) => void;
  /** `null` = no dev override, deal detail shows the real deposit balance. */
  balanceScenario: BalanceScenario | null;
  cycleBalanceScenario: () => void;
  /** Bumped whenever a transfer/withdrawal changes account balances, so screens
      that read them (deal confirmation, Home, withdrawals) know to refetch. */
  balancesVersion: number;
  bumpBalancesVersion: () => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  selectedAssetGroup: 'crypto',
  setSelectedAssetGroup: (group) => set({ selectedAssetGroup: group }),
  balanceScenario: null,
  cycleBalanceScenario: () => {
    const current = get().balanceScenario;
    const index = current ? SCENARIOS.indexOf(current) : -1;
    set({ balanceScenario: SCENARIOS[(index + 1) % SCENARIOS.length] });
  },
  balancesVersion: 0,
  bumpBalancesVersion: () => set((s) => ({ balancesVersion: s.balancesVersion + 1 })),
}));
