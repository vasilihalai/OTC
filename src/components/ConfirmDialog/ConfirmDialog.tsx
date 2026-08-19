import { Modal } from '@/components/Modal/Modal.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { bem } from '@/css/bem.ts';
import { ru } from '@/i18n/ru.ts';

import './ConfirmDialog.css';

const [b, e] = bem('confirm-dialog');

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className={b()}>
        {body && <p className={e('body')}>{body}</p>}
        <div className={e('actions')}>
          <Button variant="accent" onClick={onConfirm}>{ru.common.confirmYes}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>{ru.common.confirmNo}</Button>
        </div>
      </div>
    </Modal>
  );
}
