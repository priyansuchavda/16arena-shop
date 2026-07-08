"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, Info, Loader2, Sparkles, Tag as TagIcon, ArrowRight, Pencil, ChevronRight, SquarePen, Zap, ShieldCheck } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
import { HudPanel } from "./hud";
import { ScrollRow } from "./scroll-row";
import { CoinIcon, ZapIcon } from "@/shared/components/icons";
import { gradientFor, apiToCard } from "@/features/shop/utils/mappers";
import { useAuthStore, useUserSummary } from "@/features/auth";
import { shopApi, buildCheckoutRequest } from "../api";
import { PaymentSummarySheet } from "./payment-summary-sheet";
import { CouponSuggestionsList } from "./coupon-suggestions-list";
import { EditAmountModal } from "./edit-amount-modal";
import { EditCoinsModal } from "./edit-coins-modal";
import {
  ShopProductDetail,
  ShopSku,
  CheckoutPreview,
  ShopAmountRestrictions,
  CardModel,
  MyCoupon,
} from "../types/shop.types";
import {
  splitFixedSkus,
  resolveFlexibleSku,
  isFlexibleSkuSelection,
  resolveSkuAmountRestrictions,
  shouldShowCoinEditor,
  computeFlexibleSubtotal,
} from "../services/product.service";
import {
  activePaymentRules,
  buyDisabledReason,
  capCoinsToRedeem,
  previewCheckoutWithHybridRetry,
  previewCoinCap,
  resolveAllowHybridInrPayment,
  resolveBuyButtonLabel,
  resolveMaxCoinsAllowedForSelection,
  resolveMaxCoinCoveragePercent,
  formatPercent,
  formatDeliveryVoucherAmount,
} from "../utils/checkout.utils";
import { resolveSkuRetailPrice } from "../utils/normalize-product";

function rgba(hex: string, opacity: number) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface LiveProductDetailProps {
  product: ShopProductDetail;
  related?: CardModel[];
}

export function LiveProductDetail({ product, related = [] }: LiveProductDetailProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const { data: userSummary } = useUserSummary();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  // Extract color tokens
  const g = gradientFor(product.brandName ?? product.name);
  const fixedSkus = useMemo(() => splitFixedSkus(product), [product]);
  const flexibleSku = useMemo(() => resolveFlexibleSku(product), [product]);

  // Active SKU states
  const [selectedSku, setSelectedSku] = useState<ShopSku | null>(() => {
    if (fixedSkus.length > 0) {
      const popular = fixedSkus.find((s) => s.isPopular);
      return popular || fixedSkus[0];
    }
    return flexibleSku || null;
  });

  const isFlexibleSelection = selectedSku?.isDynamicDenomination ?? false;

  // Flexible Amount fields
  const amountRestrictions = useMemo(() => {
    if (!selectedSku) return null;
    return resolveSkuAmountRestrictions(product, selectedSku);
  }, [product, selectedSku]);

  const [customAmountText, setCustomAmountText] = useState(() => {
    return amountRestrictions ? String(amountRestrictions.minVoucherAmount) : "";
  });
  const [customAmount, setCustomAmount] = useState<number>(() => {
    return amountRestrictions ? amountRestrictions.minVoucherAmount : 0;
  });
  const [amountError, setAmountError] = useState<string | null>(null);
  const [showEditAmountModal, setShowEditAmountModal] = useState(false);

  // Mobile product detail always checks out quantity 1.
  const cartQuantity = 1;

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [showCouponList, setShowCouponList] = useState(false);
  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const couponFieldRef = useRef<HTMLDivElement>(null);

  // Coins settings
  const [applyCoins, setApplyCoins] = useState(true);
  const [customCoins, setCustomCoins] = useState<number | null>(null);
  const [showEditCoinsModal, setShowEditCoinsModal] = useState(false);

  // Accordions states
  const [showHowToRedeem, setShowHowToRedeem] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);
  const [activeRetailModeIdx, setActiveRetailModeIdx] = useState(0);

  // Checkout Preview cache
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);
  const [cartItemIds, setCartItemIds] = useState<string[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const coinsBalance = checkoutPreview?.coinsBalance ?? userSummary?.arenaCoins ?? 0;

  const cartSyncKeyRef = useRef<string>("");
  const cartSyncedRef = useRef(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voucherFaceValue = isFlexibleSelection && customAmount > 0 ? customAmount : null;

  // Handle custom amount validation automatically when customAmount changes
  useEffect(() => {
    if (isFlexibleSelection && amountRestrictions && customAmount > 0) {
      if (customAmount < amountRestrictions.minVoucherAmount) {
        setAmountError(`Minimum amount is ₹${amountRestrictions.minVoucherAmount}`);
      } else if (customAmount > amountRestrictions.maxVoucherAmount) {
        setAmountError(`Maximum amount is ₹${amountRestrictions.maxVoucherAmount}`);
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  }, [customAmount, isFlexibleSelection, amountRestrictions]);

  // Computes optimal coins
  const subtotal = useMemo(() => {
    if (!selectedSku) return 0;
    if (isFlexibleSelection) {
      return computeFlexibleSubtotal(product, selectedSku, customAmount) * cartQuantity;
    }
    return resolveSkuRetailPrice(selectedSku) * cartQuantity;
  }, [product, selectedSku, isFlexibleSelection, customAmount, cartQuantity]);

  const paymentRules = activePaymentRules(checkoutPreview, selectedSku);

  const ruleCoinCap = useMemo(() => {
    if (!selectedSku) return 0;
    return resolveMaxCoinsAllowedForSelection({
      product,
      sku: selectedSku,
      preview: checkoutPreview,
      coinsBalance,
      subtotal,
      voucherFaceValue,
    });
  }, [selectedSku, checkoutPreview, product, coinsBalance, subtotal, voucherFaceValue]);

  const optimalCoins = useMemo(() => {
    return previewCoinCap(coinsBalance, ruleCoinCap);
  }, [coinsBalance, ruleCoinCap]);

  const coinsToRedeem = useMemo(() => {
    if (!applyCoins) return 0;
    if (customCoins !== null) {
      return Math.min(customCoins, optimalCoins);
    }
    return optimalCoins;
  }, [applyCoins, customCoins, optimalCoins]);

  const cappedCoinsToRedeem = useMemo(() => {
    return capCoinsToRedeem({
      requested: coinsToRedeem,
      coinsBalance,
      maxCoinsAllowed: ruleCoinCap,
    });
  }, [coinsToRedeem, coinsBalance, ruleCoinCap]);

  const allowHybridInrPayment = useMemo(() => {
    return resolveAllowHybridInrPayment({
      coinsToRedeem: cappedCoinsToRedeem,
      maxCoinsAllowed: ruleCoinCap,
      paymentRules,
    });
  }, [cappedCoinsToRedeem, ruleCoinCap, paymentRules]);

  const buildDeliveryInfo = () => {
    if (!isFlexibleSelection || !customAmount) return undefined;
    return {
      customVoucherAmount: formatDeliveryVoucherAmount(customAmount),
    };
  };

  const getCartSyncKey = () =>
    `${selectedSku?.id ?? ""}:${cartQuantity}:${isFlexibleSelection ? customAmount : "fixed"}`;

  const canFetchCheckoutPreview = () => {
    if (!selectedSku || !isAuthenticated) return false;
    if (isFlexibleSelection && (!customAmount || amountError)) return false;
    return true;
  };

  const buildPreviewRequest = (couponCodeOverride?: string | null) =>
    buildCheckoutRequest({
      cartItemIds: null,
      coinsToRedeem: cappedCoinsToRedeem,
      couponCode: couponCodeOverride !== undefined ? couponCodeOverride : appliedCoupon,
      allowHybridInrPayment,
      quantity: cartQuantity,
      isSquad: cartQuantity >= 5,
    });

  const applyPreviewResult = (preview: CheckoutPreview) => {
    setCheckoutPreview(preview);
    const lineIds =
      preview.lines
        ?.map((line) => line.cartItemId)
        .filter((id): id is string => Boolean(id)) ?? [];
    if (lineIds.length > 0) {
      setCartItemIds(lineIds);
    }
    setPreviewError(null);
  };

  const requestCheckoutPreview = async (
    couponCodeOverride?: string | null
  ): Promise<CheckoutPreview | null> => {
    const preview = await previewCheckoutWithHybridRetry(
      buildPreviewRequest(couponCodeOverride),
      (request) => shopApi.checkoutPreview(request)
    );
    applyPreviewResult(preview);
    return preview;
  };

  const revalidateCouponIfNeeded = async () => {
    if (!appliedCoupon) return;
    const result = await shopApi.validateCoupon(appliedCoupon, { cartItemIds: null });
    if (!result.valid) {
      setAppliedCoupon(null);
      setCouponError(result.message ?? "Coupon is no longer valid");
    }
  };

  const syncCartAndPreview = async (): Promise<CheckoutPreview | null> => {
    if (!canFetchCheckoutPreview() || !selectedSku) return null;

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const cart = await shopApi.addToCart(
        selectedSku.id,
        cartQuantity,
        isFlexibleSelection ? customAmount : null,
        buildDeliveryInfo()
      );
      if (!cart) {
        setPreviewError("Could not update cart for this selection.");
        return null;
      }

      const ids = cart.items.map((item) => item.id).filter(Boolean);
      if (ids.length > 0) setCartItemIds(ids);
      cartSyncKeyRef.current = getCartSyncKey();
      cartSyncedRef.current = true;

      await revalidateCouponIfNeeded();

      return await requestCheckoutPreview();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Error validating order calculations.";
      setPreviewError(message);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewCheckoutOnly = async (): Promise<CheckoutPreview | null> => {
    if (!canFetchCheckoutPreview() || !cartSyncedRef.current) return null;

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      return await requestCheckoutPreview();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Error validating order calculations.";
      setPreviewError(message);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewCheckoutWithCoupon = async (code: string): Promise<CheckoutPreview> => {
    if (!canFetchCheckoutPreview()) {
      throw new Error("Could not preview checkout for this item.");
    }
    if (!cartSyncedRef.current) {
      await syncCartAndPreview();
    }
    const preview = await requestCheckoutPreview(code.trim());
    if (!preview) {
      throw new Error("Could not apply coupon for this order.");
    }
    return preview;
  };

  const scheduleSyncPreview = () => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      void syncCartAndPreview();
    }, 300);
  };

  const schedulePreviewOnly = () => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      void previewCheckoutOnly();
    }, 300);
  };

  const loadPreview = async ({
    syncCart = false,
  }: { syncCart?: boolean } = {}): Promise<CheckoutPreview | null> => {
    if (syncCart || !cartSyncedRef.current) {
      return syncCartAndPreview();
    }
    return previewCheckoutOnly();
  };

  // Reset cart sync when selection changes; debounced sync+preview (mobile _schedulePreview).
  useEffect(() => {
    setCheckoutPreview(null);
    setPreviewError(null);
    setCartItemIds(null);
    cartSyncedRef.current = false;
    cartSyncKeyRef.current = "";
    setCustomCoins(null);

    if (!isAuthenticated || !selectedSku) return;
    if (isFlexibleSelection && (!customAmount || amountError)) return;

    scheduleSyncPreview();

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [selectedSku?.id, customAmount, isFlexibleSelection, isAuthenticated]);

  // Preview-only refresh when coins/coupon/hybrid change (mobile _schedulePreviewOnly).
  useEffect(() => {
    if (!isAuthenticated || !cartSyncedRef.current) return;
    if (isFlexibleSelection && (!customAmount || amountError)) return;

    schedulePreviewOnly();

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [cappedCoinsToRedeem, appliedCoupon, isAuthenticated]);

  // Set default flexible amount when selecting flexible SKU
  useEffect(() => {
    if (isFlexibleSelection && amountRestrictions) {
      setCustomAmountText(String(amountRestrictions.minVoucherAmount));
      setCustomAmount(amountRestrictions.minVoucherAmount);
      setAmountError(null);
    }
  }, [selectedSku, isFlexibleSelection, amountRestrictions]);

  const buyWarning = useMemo(
    () =>
      buyDisabledReason({
        sku: selectedSku,
        coinsBalance,
        paymentRules,
        preview: checkoutPreview,
        amountError: isFlexibleSelection ? amountError : null,
      }),
    [selectedSku, coinsBalance, paymentRules, checkoutPreview, amountError, isFlexibleSelection]
  );

  const buyButtonLabel = resolveBuyButtonLabel(checkoutPreview);
  const displayCoinsSpent = checkoutPreview?.coinsSpent ?? cappedCoinsToRedeem;

  const triggerBuy = async () => {
    if (!selectedSku || buyWarning) return;
    if (isFlexibleSelection && amountError) return;

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const preview = checkoutPreview ?? (await loadPreview({ syncCart: true }));
    if (preview) {
      setPaymentSheetOpen(true);
    }
  };

  const handleApplyCoupon = async () => {
    await applyCouponCode(couponCode);
  };

  const loadMyCoupons = useCallback(async () => {
    if (!isAuthenticated) return;
    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const coupons = await shopApi.getMyCoupons();
      setMyCoupons(coupons);
    } catch (err: unknown) {
      setMyCoupons([]);
      setCouponsError(
        err instanceof Error ? err.message : "Could not load your coupons."
      );
    } finally {
      setCouponsLoading(false);
    }
  }, [isAuthenticated]);

  const handleCouponInputFocus = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (appliedCoupon) return;
    setShowCouponList(true);
    void loadMyCoupons();
  };

  const handleSelectCoupon = (code: string) => {
    setCouponCode(code);
    setShowCouponList(false);
  };

  const applyCouponCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !isAuthenticated || !selectedSku) return;

    setCouponValidating(true);
    setCouponError(null);
    setShowCouponList(false);

    try {
      const preview = await previewCheckoutWithCoupon(code);
      const appliedCode = preview.couponCode?.trim();
      const isApplied =
        appliedCode != null && appliedCode.toUpperCase() === code.toUpperCase();

      if (!isApplied && (preview.discountAmount ?? preview.totalDiscount ?? 0) <= 0) {
        setAppliedCoupon(null);
        let couponsList = myCoupons;
        if (couponsList.length === 0) {
          try {
            couponsList = await shopApi.getMyCoupons();
            setMyCoupons(couponsList);
          } catch {
            // ignore
          }
        }
        const matchedCoupon = couponsList.find(
          (c) => c.code.toUpperCase() === code.toUpperCase()
        );
        if (matchedCoupon && matchedCoupon.minOrderValue != null && matchedCoupon.minOrderValue > 0) {
          setCouponError(
            `To apply this coupon, minimum order value required is ₹${matchedCoupon.minOrderValue.toLocaleString("en-IN")}`
          );
        } else {
          setCouponError("This coupon could not be applied.");
        }
        return;
      }

      setCouponCode(appliedCode ?? code.toUpperCase());
      setAppliedCoupon(appliedCode ?? code.toUpperCase());
      setCouponError(null);
    } catch (err: unknown) {
      setAppliedCoupon(null);
      setCouponError(
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Could not apply coupon."
      );
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
    setShowCouponList(false);
    schedulePreviewOnly();
  };

  const handleEditVoucherWorth = () => {
    setShowEditAmountModal(true);
  };

  const handleEditCoins = () => {
    setShowEditCoinsModal(true);
  };

  useEffect(() => {
    if (!showCouponList) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        couponFieldRef.current &&
        !couponFieldRef.current.contains(event.target as Node)
      ) {
        setShowCouponList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCouponList]);

  // Pricing from server preview when available (mobile _buildPricingSection).
  const displayPrice = checkoutPreview?.totalPayable ?? subtotal;
  const displayOriginal = isFlexibleSelection
    ? customAmount * cartQuantity
    : (checkoutPreview?.originalUnitPrice ??
        selectedSku?.originalPrice ??
        resolveSkuRetailPrice(selectedSku)) * cartQuantity;
  const maxCoinCoveragePct = useMemo(
    () =>
      resolveMaxCoinCoveragePercent({
        preview: checkoutPreview,
        sku: selectedSku,
        productCoinRules: product.coinRules,
        paymentRules,
      }),
    [checkoutPreview, selectedSku, product.coinRules, paymentRules]
  );

  const savingsPct = isFlexibleSelection
    ? 0
    : selectedSku?.savingsPercent ||
      Math.round(
        (1 - resolveSkuRetailPrice(selectedSku) / (selectedSku?.originalPrice || 1)) * 100
      );

  return (
    <div className="relative flex-1 pb-20">
      {/* Dynamic graphic background */}
      {product.heroImageUrl && (
        <div className="absolute right-0 top-[-80px] pointer-events-none hidden lg:block w-[55%] h-[680px] overflow-hidden opacity-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.heroImageUrl}
            alt=""
            className="w-full h-full object-cover rounded-3xl"
            style={{
              maskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
            }}
          />
        </div>
      )}
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 relative z-10 pt-6">
        {/* Left Column: Product Info & Purchase Flow (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full max-w-[560px]">
          {/* Brand Premium Card Design */}
          <div className="relative w-full aspect-[1.85/1] rounded-[14px] overflow-hidden border border-white/10 p-6 flex flex-col justify-between shadow-2xl transition hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${g.accent} 0%, ${g.accent2} 100%)`,
              boxShadow: `0 20px 50px -15px ${rgba(g.accent, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.15)`
            }}>
            <div className="flex justify-between items-start">
            </div>

            <div className="mx-auto flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-[16px] px-5 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] select-none">
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.08em] mb-1">Voucher worth</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-3xl font-black leading-none tabular-nums">
                  ₹{(isFlexibleSelection ? customAmount : selectedSku?.faceValue ?? selectedSku?.unitAmount ?? 0).toLocaleString("en-IN")}
                </span>
                <button
                  type="button"
                  onClick={handleEditVoucherWorth}
                  className="p-1 rounded-md text-white/70 hover:bg-white/10 hover:text-white active:scale-90 transition"
                  title="Select Denomination"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {product.logoUrl && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-black/10">
                  <Image src={product.logoUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
                {product.brandName ?? product.name}
              </span>
            </div>
          </div>

          {/* Badge & Info */}
          <div className="flex flex-col gap-2 items-start mt-2">
            {(selectedSku?.savingsPercent ?? product.savingsPercent ?? 5) > 0 && (
              <span className="px-2 py-0.5 bg-[#25C26E] text-white text-[10px] font-black rounded uppercase select-none w-fit">
                {selectedSku?.savingsPercent ?? product.savingsPercent ?? 5}% Off
              </span>
            )}
            <h1 className="text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>
            <span className="text-sm font-extrabold text-[var(--flame)]">
              Get for {savingsPct > 0 ? `${savingsPct}% off` : "best price"}
            </span>
            {(() => {
              const coinsSpent = checkoutPreview?.coinsSpent ?? 0;
              if (coinsSpent > 0) {
                return (
                  <div className="flex flex-col gap-1.5 mt-1 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-[32px] font-black text-white tabular-nums">
                        ₹{displayPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xl font-black text-white/50">+</span>
                      <Image src={coinImg} alt="" width={18} height={18} className="-mt-0.5" />
                      <span className="text-2xl font-black text-[#F5A623] tabular-nums">
                        {coinsSpent.toLocaleString()}
                      </span>
                    </div>
                    {displayOriginal > displayPrice && (
                      <span className="text-xs text-white/40 line-through font-semibold tabular-nums ml-0.5">
                        ₹{displayOriginal.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[32px] font-black text-white tabular-nums">
                    ₹{displayPrice.toLocaleString("en-IN")}
                  </span>
                  {displayOriginal > displayPrice && (
                    <span className="text-sm text-white/40 line-through font-semibold tabular-nums">
                      ₹{displayOriginal.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>


          {/* Coupon & Coins Single Container */}
          <div className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl flex flex-col p-4 gap-3.5 select-none relative">
            {/* Top Area: Apply Coupon */}
            <div ref={couponFieldRef} className="relative w-full flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-[var(--flame)]" />
                <span className="text-sm font-extrabold text-white">Apply coupon</span>
              </div>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                  <div>
                    <p className="text-xs font-bold text-white">Code &apos;{appliedCoupon}&apos; applied</p>
                    {(checkoutPreview?.discountAmount ?? checkoutPreview?.totalDiscount ?? 0) > 0 && (
                      <p className="text-[10px] text-white/60 mt-0.5">
                        Saved ₹{(checkoutPreview!.discountAmount ?? checkoutPreview!.totalDiscount).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="live-coupon-code"
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCouponCode(val);
                      if (val.trim() === "") {
                        setShowCouponList(true);
                      } else {
                        const hasMatch = myCoupons.some((c) =>
                          c.code.toUpperCase().startsWith(val.trim().toUpperCase())
                        );
                        setShowCouponList(hasMatch);
                      }
                    }}
                    onFocus={handleCouponInputFocus}
                    onClick={handleCouponInputFocus}
                    placeholder="Enter coupon code"
                    autoComplete="off"
                    className="flex-1 h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white placeholder:text-white/20 outline-none focus:border-[var(--flame)] focus:ring-0 focus-visible:outline-none"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponValidating || !couponCode.trim()}
                    className="h-11 px-4 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 active:scale-95 transition disabled:opacity-40"
                  >
                    {couponValidating ? "Checking…" : "Apply"}
                  </button>
                </div>
              )}

              {showCouponList && !appliedCoupon && (
                <CouponSuggestionsList
                  coupons={myCoupons.filter((c) =>
                    c.code.toUpperCase().startsWith(couponCode.trim().toUpperCase())
                  )}
                  loading={couponsLoading}
                  error={couponsError}
                  onSelect={handleSelectCoupon}
                  onClose={() => setShowCouponList(false)}
                />
              )}
              
              {couponError && (
                <p className="text-[10px] font-bold text-red-400 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {couponError}
                </p>
              )}
            </div>

            {/* Divider Line */}
            {shouldShowCoinEditor({ paymentRules, sku: selectedSku }) && optimalCoins > 0 && (
              <div className="h-[1px] bg-white/5 w-full" />
            )}

            {/* Bottom Area: Arena Coins */}
            {shouldShowCoinEditor({ paymentRules, sku: selectedSku }) && optimalCoins > 0 && (
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                  <Image src={coinImg} alt="" width={16} height={16} />
                  <span>100 Arena Coins = ₹1</span>
                </div>
                <button
                  type="button"
                  onClick={handleEditCoins}
                  className="flex items-center gap-2 bg-black/45 border border-white/5 px-2.5 py-1.5 rounded-[8px] text-xs font-bold text-white hover:bg-white/5 active:scale-95 transition"
                >
                  <Image src={coinImg} alt="" width={13} height={13} />
                  <span className="text-[var(--coin)] font-extrabold">{cappedCoinsToRedeem.toLocaleString()}</span>
                  <SquarePen className="w-3.5 h-3.5 text-white/70 ml-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Buy Action Button */}
          <div className="w-full">
            <button
              type="button"
              onClick={triggerBuy}
              disabled={!selectedSku || !!buyWarning || previewLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flame)] via-[var(--flame-deep)] to-[var(--flame)] text-sm font-extrabold uppercase tracking-wider text-black shadow-[0_12px_24px_-10px_rgba(255,68,0,0.4)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !isAuthenticated ? (
                <span>Sign in to Buy</span>
              ) : buyButtonLabel.kind === "coins_only" ? (
                <span className="inline-flex items-center gap-1">
                  Buy with
                  <Image src={coinImg} alt="" width={16} height={16} />
                  {buyButtonLabel.coinsSpent.toLocaleString()}
                </span>
              ) : buyButtonLabel.kind === "hybrid" ? (
                <span className="inline-flex items-center gap-1">
                  Buy at ₹{buyButtonLabel.totalPayable.toLocaleString("en-IN")} +
                  <Image src={coinImg} alt="" width={16} height={16} />
                  {buyButtonLabel.coinsSpent.toLocaleString()}
                </span>
              ) : buyButtonLabel.kind === "inr_only" ? (
                <span>Buy at ₹{buyButtonLabel.totalPayable.toLocaleString("en-IN")}</span>
              ) : (
                <span>Buy Now</span>
              )}
              {!previewLoading && <ArrowRight className="h-4 w-4 text-black" />}
            </button>
            {buyWarning && (
              <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-center text-xs font-semibold text-amber-300">
                {buyWarning}
              </div>
            )}
            <div className="mt-4 p-4 border border-white/5 bg-[#1C1C1E]/50 rounded-2xl grid grid-cols-3 gap-3 items-center select-none">
              {/* Instant Delivery */}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--flame)] shrink-0" fill="var(--flame)" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-extrabold text-white leading-tight">Instant Delivery</span>
                  <span className="text-[8px] text-white/40 mt-0.5 font-medium leading-none">Get your code instantly</span>
                </div>
              </div>
              
              {/* 100% Secure */}
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" fill="#F5A623" fillOpacity={0.15} />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-extrabold text-white leading-tight">100% Secure</span>
                  <span className="text-[8px] text-white/40 mt-0.5 font-medium leading-none">Safe & trusted payment</span>
                </div>
              </div>

              {/* Official vouchers */}
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" fill="#F5A623" fillOpacity={0.15} />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-extrabold text-white leading-tight">Official vouchers</span>
                  <span className="text-[8px] text-white/40 mt-0.5 font-medium leading-none">Genuine & Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Informational Cards & Instructions (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full lg:sticky lg:top-[90px]">
          {/* Info cards (Redeem, Expiry, Usage) */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {/* REDEEM */}
            <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-white/5 bg-black/25">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white mt-3">REDEEM</span>
              <span className="text-[10px] font-semibold text-white/40 mt-1">
                {product.giftCardInfo?.redemptionType === "ONLINE" ? "Online" : "Online"}
              </span>
            </div>

            {/* EXPIRY */}
            <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-white/5 bg-black/25">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white mt-3">EXPIRY</span>
              <span className="text-[10px] font-semibold text-white/40 mt-1">
                {product.giftCardInfo?.expiryLabel || "1 Year"}
              </span>
            </div>

            {/* USAGE */}
            <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-white/5 bg-black/25">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white mt-3">USAGE</span>
              <span className="text-[10px] font-semibold text-white/40 mt-1">
                {product.giftCardInfo?.cardType || "One Time"}
              </span>
            </div>
          </div>

          {/* How to Redeem container */}
          {(product.giftCardInfo?.howToUseInstructions || (product.giftCardInfo?.howToUseRetailModes && product.giftCardInfo.howToUseRetailModes.length > 0)) && (
            <div className="w-full rounded-2xl border border-white/5 bg-black/25 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                className="w-full flex items-center justify-between p-5 font-extrabold text-sm text-white hover:bg-white/[0.01] transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-white/70">❓</span>
                  <span>How to redeem</span>
                </span>
                {showHowToRedeem ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
              </button>

              {showHowToRedeem && (
                <>
                  <div className="h-[1px] bg-white/10 w-full" />
                  <div className="p-5 text-xs text-white/70 leading-relaxed bg-black/10 flex flex-col gap-3.5">
                    {product.giftCardInfo.howToUseRetailModes && product.giftCardInfo.howToUseRetailModes.length > 0 ? (
                      product.giftCardInfo.howToUseRetailModes[0]?.instructions?.map((line: string, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                            {idx + 1}
                          </span>
                          <p className="flex-1 mt-0.5">{line}</p>
                        </div>
                      ))
                    ) : (
                      product.giftCardInfo.howToUseInstructions?.split("\n").filter(Boolean).map((line, idx) => {
                        const cleaned = line.replace(/^\d+[\.\-\s]*/, "");
                        return (
                          <div key={idx} className="flex gap-3 items-start">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                              {idx + 1}
                            </span>
                            <p className="flex-1 mt-0.5">{cleaned}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Terms & Conditions collapsible container */}
          {product.giftCardInfo?.termsAndConditions && (
            <div className="w-full rounded-2xl border border-white/5 bg-black/25 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-5 font-extrabold text-sm text-white hover:bg-white/[0.01] transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-white/70">📋</span>
                  <span>Terms & Conditions</span>
                </span>
                {showTerms ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
              </button>
              {showTerms && (
                <div className="p-5 pt-5 text-xs text-white/70 leading-relaxed border-t border-white/5 bg-black/10 flex flex-col gap-3">
                  {Array.isArray(product.giftCardInfo.termsAndConditions) ? (
                    (product.giftCardInfo.termsAndConditions as any).map((term: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                          {idx + 1}
                        </span>
                        <p className="flex-1 mt-0.5">{term}</p>
                      </div>
                    ))
                  ) : (
                    <div className="whitespace-pre-wrap">{product.giftCardInfo.termsAndConditions}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-4 relative z-10">
          <ScrollRow title="You may also like" items={related} card="section" />
        </div>
      )}

      {selectedSku && (
        <PaymentSummarySheet
          open={paymentSheetOpen}
          onClose={() => {
            setPaymentSheetOpen(false);
            setCheckoutPreview(null);
            setCartItemIds(null);
            cartSyncedRef.current = false;
          }}
          product={product}
          sku={selectedSku}
          quantity={cartQuantity}
          coinsBalance={coinsBalance}
          initialCoinsToRedeem={checkoutPreview?.coinsSpent ?? cappedCoinsToRedeem}
          couponCode={appliedCoupon}
          customVoucherAmount={isFlexibleSelection ? customAmount : null}
          initialPreview={checkoutPreview}
          cartItemIds={cartItemIds}
        />
      )}

      {selectedSku && (
        <EditAmountModal
          open={showEditAmountModal}
          onClose={() => setShowEditAmountModal(false)}
          product={product}
          sku={selectedSku}
          fixedSkus={fixedSkus}
          isFlexibleSelection={isFlexibleSelection}
          initialAmountText={customAmountText}
          amountRestrictions={amountRestrictions}
          onConfirm={(amountText, amount, selSku) => {
            setShowEditAmountModal(false);
            if (selSku) {
              setSelectedSku(selSku);
              setCustomCoins(null);
            }
            setCustomAmountText(amountText);
            setCustomAmount(amount);
            void loadPreview();
          }}
        />
      )}
      <EditCoinsModal
        open={showEditCoinsModal}
        onClose={() => setShowEditCoinsModal(false)}
        maxCoins={optimalCoins}
        initialCoins={customCoins ?? optimalCoins}
        onConfirm={(coins) => {
          setShowEditCoinsModal(false);
          setCustomCoins(coins);
          setApplyCoins(coins > 0);
          void loadPreview();
        }}
      />
    </div>
  );
}
