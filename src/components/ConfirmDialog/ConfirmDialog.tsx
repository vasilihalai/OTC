import { Modal } from '@/components/Modal/Modal.tsx';
import { Button } from '@/components/Button/Button.tsx';
import { ru } from '@/i18n/ru.ts';

import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={(
        <div className="button-row">
          <Button type="button" variant="secondary" onClick={onCancel}>{ru.common.confirmNo}</Button>
          <Button variant="accent" onClick={onConfirm}>{ru.common.confirmYes}</Button>
        </div>
      )}
    >
      {body && <p className="confirm-dialog__body">{body}</p>}
    </Modal>
  );
}
