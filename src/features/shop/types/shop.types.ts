export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  badgeText: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isHero: boolean;
  productCount: number;
  subCategories?: ApiCategory[];
};

export type ApiProduct = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  brandName: string | null;
  description?: string | null;
  about?: string | null;
  giftCardInfo?: {
    redemptionType?: string;
    redemptionLabel?: string;
    expiryLabel?: string;
    cardType?: string;
  } | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  thumbnailImageUrl: string | null;
  /** Full-bleed promo image used on featured / flash-deal cards. */
  featuredImage?: string | null;
  /** Bare or #-prefixed hex for the card's bottom label background, e.g. "81A600". */
  featureColor?: string | null;
  /** Label text shown on the card's bottom bar, e.g. "Buy Giftcard at 15% off". */
  featureLabel?: string | null;
  cashbackPercent: number | null;
  savingsPercent: number | null;
  maxSavingsPercent: number | null;
  startingPrice: number | null;
  startingOriginalPrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
  wishlistCount24h: number | null;
  showSku?: boolean;
  skus?: ShopSku[];
};

export type ShopConfig = Record<string, unknown>;

export type HubbleSsoTokenResponse = {
  token?: string;
  ssoToken?: string;
  jwt?: string;
  code?: string;
  message?: string;
};

export type ShopVisibility = {
  visible: boolean;
  reason?: string;
};

export type CategoryItem = {
  label: string;
  slug: string;
  color: string;
  active?: boolean;
  count?: number;
  badge?: string | null;
  iconUrl?: string | null;
};

export type LiveSection = { title: string; items: CardModel[] };

export type Tone = "hot" | "low" | "new";
export type Tag = { tone: Tone; label: string };
export type CardBadge = { tone: Tone; label: string };

export type CardModel = {
  id: string;
  slug: string;
  brand: string;
  name?: string;
  sub: string;
  accent: string;
  accent2: string;
  imageUrl?: string | null;
  /** Full-bleed promo image (overrides imageUrl on featured / flash-deal cards). */
  featureImageUrl?: string | null;
  /** Hex color for the bottom label background. */
  featureColor?: string | null;
  /** Text shown on the bottom label bar. */
  featureLabel?: string | null;
  priceStr: string;
  originalStr?: string;
  saveStr?: string;
  savePct?: number;
  cashbackPct?: number;
  /** Cash price for section card footer (INR). */
  price?: number;
  /** Arena Coins for section card footer. */
  maxCoins?: number;
  /** When true, footer shows coins only. */
  isCoinOnly?: boolean;
  /** True when card uses SKU pricing (matches Flutter product.showSku). */
  showSku?: boolean;
  /** SKU displayLabel for middle text (e.g. "EA Sports FC Mobile", "Unipin ₹250"). */
  displayLabel?: string;
  coinAmount?: number;
  wishlist?: number;
  rating?: number;
  badge?: CardBadge;
  tagline?: string;
  categorySlug?: string;
};

export type Product = {
  id: string;
  slug: string;
  brand: string;
  /** Category subtitle shown under the brand, e.g. "Food & dining". */
  sub: string;
  /** Gradient start/end for the brand card. */
  accent: string;
  accent2: string;
  tag?: Tag;
  save: string;
  rating: number;
  /** Optional headline used on the larger "For you" promo cards. */
  tagline?: string;
  description?: string;
  about?: string;
  giftCardInfo?: {
    redemptionType?: string;
    redemptionLabel?: string;
    expiryLabel?: string;
    cardType?: string;
  } | null;
};

export type Denomination = {
  face: number;
  faceStr: string;
  /** Cash portion (50% off). */
  cash: number;
  cashStr: string;
  /** Arena Coins portion. */
  coins: number;
  /** Coins earned back (2%). */
  reward: number;
};

export type Section = { title: string; slugs: string[] };

export type Category = { label: string; slug: string; color: string; active?: boolean };

export type MobileSection = {
  id: string;
  page: string;
  type: string;
  category: string;
  name: string;
  desc: string;
  isVisible: boolean;
  priority: number;
  isActive: boolean;
};

export type ShopAmountRestrictions = {
  minVoucherAmount: number;
  maxVoucherAmount: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  maxVouchersPerOrder?: number;
};

export type SkuPaymentRules = {
  allowCoinRedemption: boolean;
  allowInrPayment: boolean;
  isCoinOnly: boolean;
  maxCoinsAllowedEstimate: number;
  maxCoins?: number;
  minRequiredCoins?: number;
  maxCoinDiscountEstimate?: number;
  effectiveMinRequiredCoins?: number;
  coinToInrRate?: number;
  maxCoinCoveragePercent?: number;
  /** INR remaining after applying max Arena Coins (category card hybrid price). */
  inrPayableAfterMaxCoins?: number;
};

export type ShopSku = {
  id: string;
  itemId: string;
  title: string;
  label: string;
  /** API displayLabel — preferred middle text on category cards. */
  displayLabel?: string;
  price: number;
  retailPrice: number;
  originalPrice?: number;
  unitAmount: number;
  faceValue?: number;
  currency: string;
  isAvailable: boolean;
  stockStatus: string;
  isPopular: boolean;
  sortOrder: number;
  isDynamicDenomination: boolean;
  minFaceValue?: number;
  maxFaceValue?: number;
  perUnitPrice?: number;
  savingsPercent?: number;
  maxCoinCoveragePercent?: number;
  allowCoinRedemption: boolean;
  allowInrPayment: boolean;
  isCoinOnly: boolean;
  coinPriceEstimate?: number;
  /** Root-level maxCoins from API (Flutter ShopSku.maxCoins). */
  maxCoins?: number;
  maxCoinsAllowedEstimate?: number;
  /** INR remaining after max coin redemption — preferred hybrid footer price. */
  inrPayableAfterMaxCoins?: number;
  maxQuantity?: number;
  isActive?: boolean;
  amountRestrictions?: ShopAmountRestrictions;
  paymentRules?: SkuPaymentRules;
};

export type ShopCoinRules = {
  coinToInrRate: number;
  maxCoveragePercent: number;
};

export type ShopProductDetail = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  brandName?: string | null;
  slug: string;
  description?: string | null;
  about?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isFlexible?: boolean;
  denominationType?: string;
  startingPrice?: number;
  startingOriginalPrice?: number;
  cashbackPercent?: number;
  savingsPercent?: number;
  effectiveCashbackPercent?: number;
  amountRestrictions?: ShopAmountRestrictions;
  coinRules: ShopCoinRules;
  skus: ShopSku[];
  giftCardInfo?: {
    redemptionType?: string;
    redemptionLabel?: string;
    expiryLabel?: string;
    cardType?: string;
    denominationType?: string;
    howToUseInstructions?: string;
    howToUseRetailModes?: {
      retailMode: string;
      retailModeName: string;
      instructions: string[];
    }[];
    termsAndConditions?: string;
    amountRestrictions?: ShopAmountRestrictions;
  } | null;
};

export type CheckoutPreview = {
  subtotal: number;
  totalDiscount: number;
  discountAmount?: number;
  coinsDiscount: number;
  coinsSpent: number;
  walletUsed: number;
  walletBalance?: number;
  totalPayable: number;
  totalPayableInCoins: number;
  savingsPercent?: number;
  effectiveCashbackPercent?: number;
  cashbackEarned?: number;
  cashbackCoinsEarned?: number;
  coinsBalance: number;
  unitPrice?: number;
  originalUnitPrice?: number;
  couponCode?: string;
  paymentRules?: SkuPaymentRules;
  lines?: Array<{
    cartItemId?: string;
    skuLabel?: string;
    quantity?: number;
    lineTotalPayable?: number;
    paymentRules?: SkuPaymentRules;
  }>;
};

export type CheckoutPayload = {
  cartItemIds: string[] | null;
  coinsToRedeem: number;
  useWalletCredits: boolean;
  walletCreditsToUse: number;
  couponCode: string | null;
  isSquad: boolean;
  allowHybridInrPayment: boolean;
};

/** Full checkout body for POST /v1/shop/orders — idempotencyKey is required. */
export type CheckoutRequest = CheckoutPayload & {
  idempotencyKey: string;
};

/** Preview accepts the same body; idempotencyKey is sent when a checkout attempt is in flight. */
export type CheckoutPreviewRequest = CheckoutPayload & {
  idempotencyKey?: string;
};

export type SyncCartPreviewInput = {
  skuId: string;
  quantity: number;
  customVoucherAmount?: number | null;
  deliveryInfo?: Record<string, string>;
  cartItemIds?: string[] | null;
  coinsToRedeem: number;
  useWalletCredits?: boolean;
  walletCreditsToUse?: number;
  couponCode?: string | null;
  isSquad?: boolean;
  allowHybridInrPayment: boolean;
};

export type AddCartItemRequest = {
  skuId: string;
  quantity: number;
  customVoucherAmount?: number | null;
  deliveryInfo?: Record<string, string>;
  giftRecipientUserId?: string | null;
};

export type UpdateCartItemRequest = {
  quantity?: number;
  deliveryInfo?: Record<string, string>;
  giftRecipientUserId?: string | null;
};

export type MyCoupon = {
  code: string;
  discountType?: string;
  discountValue?: number;
  maxDiscount?: number | null;
  minOrderValue?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  audienceMode?: string | null;
  grantSource?: string | null;
  grantedAt?: string | null;
  grantExpiresAt?: string | null;
};

export type CouponValidateResult = {
  valid: boolean;
  code?: string;
  discount?: number;
  message?: string;
  extraCashbackPercent?: number;
  isAffiliate?: boolean;
};

export type ShopVoucher = {
  cardNumber: string;
  cardPin?: string;
  validTill?: string;
  amount: number;
  cardType: string;
};

export type VoucherDetailField = {
  key: string;
  label: string;
  value: string;
};

export type ShopOrderItem = {
  id: string;
  skuId: string;
  productName: string;
  skuLabel: string;
  brandName?: string;
  brandLogoUrl?: string;
  productImageUrl?: string;
  faceValue?: number;
  quantity: number;
  unitPrice: number;
  fulfillmentStatus: string;
  fulfillmentType?: string;
  fulfillmentMessage?: string;
  voucherCode?: string;
  giftCardDelivery?: Record<string, unknown> | null;
  vouchers: ShopVoucher[];
  voucherDetails: VoucherDetailField[];
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  coinsDiscount: number;
  coinsSpent: number;
  walletUsed: number;
  totalPaid: number;
  cashbackEarned: number;
  cashbackCoinsEarned?: number;
  paymentMethod: string;
  couponCode?: string;
  createdAt: string;
  items: ShopOrderItem[];
};

export type CartItem = {
  id: string;
  skuId: string;
  quantity: number;
  productName: string;
  skuLabel: string;
  unitPrice: number;
  lineTotal?: number;
  inStock?: boolean;
  heroImageUrl?: string | null;
  productImageUrl?: string | null;
  deliveryInfo?: Record<string, unknown> | null;
};

export type CartData = {
  id: string;
  itemCount: number;
  subtotal?: number;
  items: CartItem[];
};

export type OrderInvoice = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  coinsDiscount: number;
  coinsSpent: number;
  walletUsed: number;
  totalPaid: number;
  paymentMethod?: string;
  couponCode?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items?: Array<{
    productName: string;
    skuLabel: string;
    quantity: number;
    unitPrice: number;
    faceValue?: number;
  }>;
  [key: string]: unknown;
};

export type MobileBanner = {
  id: string;
  page: string;
  type: string;
  category: string;
  isVisible: boolean;
  priority: number;
  image: string;
  cta: string | null;
};
