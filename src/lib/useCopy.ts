import { useToastStore } from '@/store/toast.ts';
import { copyToClipboard, notifySuccess } from '@/telegram/adapter.ts';
import { ru } from '@/i18n/ru.ts';

/** Copy-to-clipboard + haptic + `Скопировано` toast, shared by every copy affordance in the app. */
export function useCopy(): (text: string) => void {
  const show = useToastStore((s) => s.show);
  return (text: string) => {
    void copyToClipboard(text).then(() => {
      notifySuccess();
      show(ru.common.copiedToast);
    });
  };
}
