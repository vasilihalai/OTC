import { create } from 'zustand';

import type { AssetGroup } from '@/api/index.ts';

interface UiStore {
  selectedAssetGroup: AssetGroup;
  setSelectedAssetGroup: (group: AssetGroup) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedAssetGroup: 'crypto',
  setSelectedAssetGroup: (group) => set({ selectedAssetGroup: group }),
}));
