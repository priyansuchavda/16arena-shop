import type { ShopOrderItem } from "../types/shop.types";

export type OrderCredentialField = {
  id: string;
  key: string;
  label: string;
  value: string;
  highlight?: "pin" | "code";
};

const FIELD_PRIORITY: Record<string, number> = {
  code: 0,
  vouchercode: 0,
  pin: 1,
  serial: 2,
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatLabel(key: string, label: string): string {
  const normalized = normalizeKey(key);
  if (normalized === "code" || normalized === "vouchercode") return "Voucher Code";
  if (normalized === "pin") return "PIN";
  if (normalized === "serial") return "Serial";
  if (label.trim()) return label.trim();
  return key;
}

function fieldHighlight(key: string): OrderCredentialField["highlight"] {
  const normalized = normalizeKey(key);
  if (normalized === "pin") return "pin";
  if (normalized === "code" || normalized === "vouchercode") return "code";
  return undefined;
}

function sortFields(a: OrderCredentialField, b: OrderCredentialField): number {
  const pa = FIELD_PRIORITY[normalizeKey(a.key)] ?? 99;
  const pb = FIELD_PRIORITY[normalizeKey(b.key)] ?? 99;
  if (pa !== pb) return pa - pb;
  return a.label.localeCompare(b.label);
}

export function buildOrderItemCredentials(
  item: ShopOrderItem,
  itemIndex = 0
): OrderCredentialField[] {
  const fields: OrderCredentialField[] = [];
  const seenKeys = new Set<string>();
  const seenValues = new Set<string>();

  const addField = (key: string, label: string, value?: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return;

    const normalizedKey = normalizeKey(key);
    const normalizedValue = trimmed.toLowerCase();

    if (seenKeys.has(normalizedKey) || seenValues.has(normalizedValue)) return;

    seenKeys.add(normalizedKey);
    seenValues.add(normalizedValue);

    fields.push({
      id: `${item.id}-${normalizedKey}-${itemIndex}`,
      key,
      label: formatLabel(key, label),
      value: trimmed,
      highlight: fieldHighlight(key),
    });
  };

  for (const detail of item.voucherDetails ?? []) {
    addField(detail.key, detail.label, detail.value);
  }

  for (const [voucherIndex, voucher] of (item.vouchers ?? []).entries()) {
    addField(`code-${voucherIndex}`, "Voucher Code", voucher.cardNumber);
    addField(`pin-${voucherIndex}`, "PIN", voucher.cardPin);
    if (voucher.validTill) {
      addField(`validTill-${voucherIndex}`, "Valid Till", voucher.validTill);
    }
  }

  if (item.voucherCode) {
    addField("voucherCode", "Voucher Code", item.voucherCode);
  }

  return fields.sort(sortFields);
}

export function hasOrderItemCredentials(item: ShopOrderItem): boolean {
  return buildOrderItemCredentials(item).length > 0;
}
