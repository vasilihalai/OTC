import { create } from 'zustand';

import type { AssetGroup, BalanceScenario } from '@/api/index.ts';

const SCENARIOS: BalanceScenario[] = ['sufficient', 'short1', 'short', 'belowmin'];

interface UiStore {
  selectedAssetGroup: AssetGroup;
  setSelectedAssetGroup: (group: AssetGroup) => void;
  balanceScenario: BalanceScenario;
  setBalanceScenario: (scenario: BalanceScenario) => void;
  cycleBalanceScenario: () => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  selectedAssetGroup: 'crypto',
  setSelectedAssetGroup: (group) => set({ selectedAssetGroup: group }),
  balanceScenario: 'sufficient',
  setBalanceScenario: (scenario) => set({ balanceScenario: scenario }),
  cycleBalanceScenario: () => {
    const index = SCENARIOS.indexOf(get().balanceScenario);
    set({ balanceScenario: SCENARIOS[(index + 1) % SCENARIOS.length] });
  },
}));
