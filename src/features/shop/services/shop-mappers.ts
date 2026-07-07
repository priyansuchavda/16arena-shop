import type {
  CartData,
  CheckoutPreview,
  OrderInvoice,
  ShopOrder,
  SkuPaymentRules,
} from "../types/shop.types";
import { unwrapData } from "./shop-api-client";

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Record<string, unknown>;
}

export function mapCartData(raw: unknown): CartData | null {
  const data = asRecord(unwrapData(raw) ?? raw);
  if (!data) return null;

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.map((item) => {
    const row = item as Record<string, unknown>;
    const unitPrice = Number(row.unitPrice ?? 0);
    const quantity = Number(row.quantity ?? 1);
    return {
      id: String(row.id ?? ""),
      skuId: String(row.skuId ?? ""),
      quantity,
      productName: String(row.productName ?? ""),
      skuLabel: String(row.skuLabel ?? ""),
      unitPrice,
      lineTotal: Number(row.lineTotal ?? unitPrice * quantity),
      inStock: row.inStock !== false,
      heroImageUrl: (row.heroImageUrl ?? row.productImageUrl) as string | null | undefined,
      productImageUrl: row.productImageUrl as string | null | undefined,
      deliveryInfo: (row.deliveryInfo as Record<string, unknown> | null) ?? null,
    };
  });

  return {
    id: String(data.id ?? ""),
    itemCount: Number(data.itemCount ?? items.length),
    subtotal: Number(data.subtotal ?? 0),
    items,
  };
}

export function mapCheckoutPreview(raw: unknown): CheckoutPreview | null {
  const data = asRecord(unwrapData(raw) ?? raw);
  if (!data) return null;

  const lines = Array.isArray(data.lines)
    ? (data.lines as Array<Record<string, unknown>>)
    : [];
  const firstLine = lines[0];
  const paymentRules = (data.paymentRules ?? firstLine?.paymentRules) as
    | SkuPaymentRules
    | undefined;

  return {
    subtotal: Number(data.subtotal ?? 0),
    totalDiscount: Number(data.discountAmount ?? data.totalDiscount ?? 0),
    discountAmount: Number(data.discountAmount ?? data.totalDiscount ?? 0),
    coinsDiscount: Number(data.coinsDiscount ?? 0),
    coinsSpent: Number(data.coinsSpent ?? 0),
    walletUsed: Number(data.walletUsed ?? 0),
    walletBalance: Number(data.walletBalance ?? 0),
    totalPayable: Number(data.totalPayable ?? 0),
    totalPayableInCoins: Number(data.totalPayableInCoins ?? 0),
    savingsPercent: Number(
      data.savingsPercent ?? firstLine?.savingsPercent ?? 0
    ) || undefined,
    effectiveCashbackPercent: data.effectiveCashbackPercent as number | undefined,
    cashbackEarned: Number(data.cashbackEarned ?? 0),
    cashbackCoinsEarned: data.cashbackCoinsEarned as number | undefined,
    coinsBalance: Number(data.coinsBalance ?? 0),
    unitPrice: Number(data.unitPrice ?? firstLine?.unitPrice ?? 0) || undefined,
    originalUnitPrice:
      Number(data.originalUnitPrice ?? firstLine?.originalUnitPrice ?? 0) || undefined,
    couponCode: (data.couponCode as string | null) ?? undefined,
    paymentRules,
    lines: lines.map((line) => ({
      cartItemId: line.cartItemId as string | undefined,
      skuLabel: line.skuLabel as string | undefined,
      quantity: Number(line.quantity ?? 1),
      lineTotalPayable: Number(line.lineTotalPayable ?? 0),
      paymentRules: line.paymentRules as SkuPaymentRules | undefined,
    })),
  };
}

export function mapOrder(raw: unknown): ShopOrder | null {
  const data = asRecord(unwrapData(raw) ?? raw);
  if (!data) return null;

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.map((item) => {
    const row = item as Record<string, unknown>;
    const giftCardDelivery = row.giftCardDelivery as Record<string, unknown> | undefined;
    const vouchersRaw = giftCardDelivery?.vouchers;
    const vouchers = Array.isArray(vouchersRaw)
      ? vouchersRaw.map((v) => {
          const voucher = v as Record<string, unknown>;
          return {
            cardNumber: String(voucher.cardNumber ?? ""),
            cardPin: voucher.cardPin as string | undefined,
            validTill: voucher.validTill as string | undefined,
            amount: Number(voucher.amount ?? 0),
            cardType: String(voucher.cardType ?? ""),
          };
        })
      : [];

    const detailsRaw = row.voucherDetails;
    const voucherDetails = Array.isArray(detailsRaw)
      ? detailsRaw.map((d) => {
          const detail = d as Record<string, unknown>;
          return {
            key: String(detail.key ?? ""),
            label: String(detail.label ?? ""),
            value: String(detail.value ?? ""),
          };
        })
      : [];

    return {
      id: String(row.id ?? ""),
      skuId: String(row.skuId ?? ""),
      productName: String(row.productName ?? ""),
      skuLabel: String(row.skuLabel ?? ""),
      brandName: row.brandName as string | undefined,
      brandLogoUrl: row.brandLogoUrl as string | undefined,
      productImageUrl: row.productImageUrl as string | undefined,
      faceValue: row.faceValue as number | undefined,
      quantity: Number(row.quantity ?? 1),
      unitPrice: Number(row.unitPrice ?? 0),
      fulfillmentStatus: String(row.fulfillmentStatus ?? ""),
      fulfillmentType: row.fulfillmentType as string | undefined,
      fulfillmentMessage: row.fulfillmentMessage as string | undefined,
      voucherCode: row.voucherCode as string | undefined,
      giftCardDelivery: giftCardDelivery as ShopOrder["items"][number]["giftCardDelivery"],
      vouchers,
      voucherDetails,
    };
  });

  return {
    id: String(data.id ?? ""),
    orderNumber: String(data.orderNumber ?? ""),
    status: String(data.status ?? ""),
    subtotal: Number(data.subtotal ?? 0),
    discountAmount: Number(data.discountAmount ?? 0),
    coinsDiscount: Number(data.coinsDiscount ?? 0),
    coinsSpent: Number(data.coinsSpent ?? 0),
    walletUsed: Number(data.walletUsed ?? 0),
    totalPaid: Number(data.totalPaid ?? 0),
    cashbackEarned: Number(data.cashbackEarned ?? 0),
    cashbackCoinsEarned: data.cashbackCoinsEarned as number | undefined,
    paymentMethod: String(data.paymentMethod ?? "razorpay"),
    couponCode: data.couponCode as string | undefined,
    createdAt: String(data.createdAt ?? ""),
    items,
  };
}

export function mapOrderInvoiceFromOrder(order: ShopOrder): OrderInvoice {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    coinsDiscount: order.coinsDiscount,
    coinsSpent: order.coinsSpent,
    walletUsed: order.walletUsed,
    totalPaid: order.totalPaid,
    paymentMethod: order.paymentMethod,
    couponCode: order.couponCode,
    items: order.items.map((item) => ({
      productName: item.productName,
      skuLabel: item.skuLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      faceValue: item.faceValue,
    })),
  };
}
