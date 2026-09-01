import type { FiatTransferType } from '@/api/types.ts';

/**
 * api-integration.md §5.1: "PaymentTypeEnum includes BAKAI_BUSINESS,
 * INTER_BANK_KG_BUSINESS, INTER_BANK_RU_BUSINESS — those three are the
 * Внутренний / Межбанк KG / Межбанк RU triple already built into
 * WithdrawRequisites. Map them explicitly ... do not string-match on
 * labels." `SWIFT` isn't named in the doc but was already in this app's own
 * mock fixture for USD (transferType 'ru', same field set as Межбанк RU) —
 * kept as a fourth explicit entry rather than dropped, since the doc's list
 * is introduced with "includes," not "is exactly."
 */
interface PaymentTypeMeta {
  transferType: FiatTransferType;
  name: string;
}

const PAYMENT_TYPES: Record<string, PaymentTypeMeta> = {
  BAKAI_BUSINESS: { transferType: 'internal', name: 'Бакай Банк' },
  INTER_BANK_KG_BUSINESS: { transferType: 'kg', name: 'Другой Банк Кыргызстана' },
  INTER_BANK_RU_BUSINESS: { transferType: 'ru', name: 'Межбанковский перевод RU' },
  SWIFT: { transferType: 'ru', name: 'SWIFT-перевод' },
};

/** Unrecognized codes fall back to `internal` (the narrowest field set) and echo the raw code as the name, rather than guessing a wider one. */
export function paymentTypeMeta(paymentType: string): PaymentTypeMeta {
  return PAYMENT_TYPES[paymentType] ?? { transferType: 'internal', name: paymentType };
}
