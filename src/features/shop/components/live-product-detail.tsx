"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, Info, Loader2, Sparkles, Tag as TagIcon, ArrowRight, Pencil, ChevronRight, SquarePen, Zap, ShieldCheck, X } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
import voucherIcon from "@/assets/svg/voucher.svg";
import { HudPanel } from "./hud";
import { ScrollRow } from "./scroll-row";
import { CoinIcon, ZapIcon } from "@/shared/components/icons";
import { useAuthStore, useUserSummary } from "@/features/auth";
import { shopApi, buildCheckoutRequest } from "../api";
import { PaymentSummarySheet } from "./payment-summary-sheet";
import { BrandPremiumVoucherCard } from "./brand-premium-voucher-card";
import { CouponSuggestionsList } from "./coupon-suggestions-list";
import { EditAmountModal } from "./edit-amount-modal";
import { EditCoinsModal } from "./edit-coins-modal";
import { SlantedButton } from "@/shared/components/ui/slanted-button";
import { OdometerNumber, PricingSplitAmountRow } from "./pricing-amount-animation";
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
  resolveCoinToInrRate,
  resolveCoinsPerRupee,
  resolveMaxCoinsAllowedForSelection,
  resolveMaxCoinCoveragePercent,
  formatPercent,
  formatDeliveryVoucherAmount,
  formatInr,
} from "../utils/checkout.utils";
import { resolveSkuRetailPrice } from "../utils/normalize-product";
import { getCachedLogoColors, prefetchLogoColors } from "../utils/logo-colors";

export function useLogoColors(
  logoUrl: string | null,
  fallbackColors: { accent: string; accent2: string }
) {
  const [colors, setColors] = useState(
    () => getCachedLogoColors(logoUrl) ?? fallbackColors
  );

  useEffect(() => {
    if (!logoUrl) {
      setColors(fallbackColors);
      return;
    }

    const cached = getCachedLogoColors(logoUrl);
    if (cached) {
      setColors(cached);
      return;
    }

    let cancelled = false;
    prefetchLogoColors(logoUrl).then((extracted) => {
      if (!cancelled) setColors(extracted ?? fallbackColors);
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl, fallbackColors.accent, fallbackColors.accent2]);

  return colors;
}

export function useTransparentLogo(logoUrl: string | null) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(logoUrl);

  useEffect(() => {
    if (!logoUrl) {
      setProcessedUrl(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setProcessedUrl(logoUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Get background color from top-left pixel
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        if (bgA > 50) {
          const threshold = 40; // color distance threshold
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Calculate Euclidean distance in RGB space
            const dist = Math.sqrt(
              Math.pow(r - bgR, 2) +
              Math.pow(g - bgG, 2) +
              Math.pow(b - bgB, 2)
            );

            if (dist < threshold) {
              data[i + 3] = 0; // Make transparent
            }
          }
          ctx.putImageData(imgData, 0, 0);
          setProcessedUrl(canvas.toDataURL());
        } else {
          setProcessedUrl(logoUrl);
        }
      } catch (err) {
        console.error("Failed to make logo transparent:", err);
        setProcessedUrl(logoUrl);
      }
    };
    img.onerror = () => {
      setProcessedUrl(logoUrl);
    };
    img.src = logoUrl;
  }, [logoUrl]);

  return processedUrl;
}


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

  const quickSuggestions = useMemo(() => {
    if (!selectedSku || !selectedSku.isDynamicDenomination) return [100, 150, 200, 250];
    const minVal = selectedSku.minFaceValue ?? 100;
    const maxVal = selectedSku.maxFaceValue ?? 1000;

    const PRESETS = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
    let available = PRESETS.filter((p) => p >= minVal && p <= maxVal);

    if (!available.includes(minVal)) available.unshift(minVal);
    if (!available.includes(maxVal) && maxVal > minVal) available.push(maxVal);
    available = Array.from(new Set(available));

    if (available.length < 4) {
      const diff = maxVal - minVal;
      const step = Math.max(1, Math.round(diff / 3));
      const chosen = [
        minVal,
        Math.min(maxVal, minVal + step),
        Math.min(maxVal, minVal + step * 2),
        maxVal,
      ];
      return Array.from(new Set(chosen));
    }

    const p1 = available[0];
    const p4 = available[available.length - 1];
    const idx2 = Math.floor((available.length - 1) / 3);
    const idx3 = Math.floor(((available.length - 1) * 2) / 3);
    const p2 = available[idx2];
    const p3 = available[idx3];
    return Array.from(new Set([p1, p2, p3, p4]));
  }, [selectedSku]);

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
  const [showCouponModal, setShowCouponModal] = useState(false);
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

  // Computes local subtotal (unit-rate estimate). Prefer preview.subtotal for
  // coin caps — matches mobile _localSubtotal.
  const localSubtotal = useMemo(() => {
    if (!selectedSku) return 0;
    if (isFlexibleSelection) {
      return computeFlexibleSubtotal(product, selectedSku, customAmount) * cartQuantity;
    }
    return resolveSkuRetailPrice(selectedSku) * cartQuantity;
  }, [product, selectedSku, isFlexibleSelection, customAmount, cartQuantity]);

  const subtotal = checkoutPreview?.subtotal ?? localSubtotal;

  const paymentRules = activePaymentRules(checkoutPreview, selectedSku);

  // Rule-level cap (no wallet) — matches mobile _maxCoinsAllowedForSelection / _cachedCoinsRequired
  const ruleCoinCap = useMemo(() => {
    if (!selectedSku) return 0;
    return resolveMaxCoinsAllowedForSelection({
      sku: selectedSku,
      preview: checkoutPreview,
      coinsBalance,
      voucherFaceValue,
      productIsDynamicDenomination: product.isDynamicDenomination,
      skuCount: product.skus.length,
    });
  }, [
    selectedSku,
    checkoutPreview,
    coinsBalance,
    voucherFaceValue,
    product.isDynamicDenomination,
    product.skus.length,
  ]);

  // Wallet-capped optimal — matches mobile _optimalCoinsFor / _cachedOptimalCoins
  const optimalCoins = useMemo(() => {
    return previewCoinCap(coinsBalance, ruleCoinCap);
  }, [coinsBalance, ruleCoinCap]);

  // Effective coins for UI / fixed SKUs (custom clamped to optimal).
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

  /**
   * Coins sent to preview / shown as selected.
   * Matches mobile _effectiveCoinsToRedeem: always min(wallet, rule/formula cap).
   * No point selecting 20,000 when the user only has 3,820.
   */
  const previewCoinsToRedeem = useMemo(() => {
    if (!applyCoins) return 0;
    return cappedCoinsToRedeem;
  }, [applyCoins, cappedCoinsToRedeem]);

  const allowHybridInrPayment = useMemo(() => {
    return resolveAllowHybridInrPayment({
      coinsToRedeem: previewCoinsToRedeem,
      maxCoinsAllowed: ruleCoinCap,
      paymentRules,
    });
  }, [previewCoinsToRedeem, ruleCoinCap, paymentRules]);

  // "Use max" = what the user can actually spend (wallet ∩ rule/formula).
  const coinsEditSheetMax = optimalCoins;

  const coinToInrRate = useMemo(
    () => resolveCoinToInrRate({ preview: checkoutPreview, sku: selectedSku }),
    [checkoutPreview, selectedSku]
  );

  const coinsPerRupee = useMemo(
    () => resolveCoinsPerRupee({ preview: checkoutPreview, sku: selectedSku }),
    [checkoutPreview, selectedSku]
  );

  const maxCoinCoveragePercent = useMemo(
    () =>
      resolveMaxCoinCoveragePercent({
        preview: checkoutPreview,
        sku: selectedSku,
        paymentRules,
      }),
    [checkoutPreview, selectedSku, paymentRules]
  );

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
      coinsToRedeem: previewCoinsToRedeem,
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
  }, [previewCoinsToRedeem, appliedCoupon, isAuthenticated]);

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
  // Chip / buy row: wallet-capped (mobile _effectiveCoinsToRedeem).
  // Prefer live custom selection; never show more than wallet allows.
  const displayCoinsSpent = !applyCoins
    ? 0
    : customCoins !== null
      ? Math.min(customCoins, optimalCoins)
      : Math.min(checkoutPreview?.coinsSpent ?? optimalCoins, optimalCoins);

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
    if (coinsEditSheetMax <= 0) return;
    if (coinToInrRate == null || coinToInrRate <= 0) return;
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
  // While preview is clearing/reloading after SKU/amount change, fall back to a
  // local estimate so the split-row collapse→roll→expand animation still runs.
  const optimisticHeaderPricing = useMemo(() => {
    const retail = localSubtotal;
    const rate = coinToInrRate ?? 0;
    if (!applyCoins || previewCoinsToRedeem <= 0 || rate <= 0) {
      return { cash: retail, coins: 0 };
    }
    const coins = previewCoinsToRedeem;
    const cash = Math.max(0, retail - coins * rate);
    return { cash, coins };
  }, [localSubtotal, applyCoins, previewCoinsToRedeem, coinToInrRate]);

  const displayPrice =
    checkoutPreview?.totalPayable ?? optimisticHeaderPricing.cash;
  const displayCoinsSpentHeader = !applyCoins
    ? 0
    : (checkoutPreview?.coinsSpent ?? optimisticHeaderPricing.coins);

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
        paymentRules,
      }),
    [checkoutPreview, selectedSku, paymentRules]
  );

  const savingsPct = isFlexibleSelection
    ? 0
    : (selectedSku?.savingsPercent ?? product.savingsPercent ?? 0);

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
      <div className="grid grid-cols-1 items-start gap-6 lg:gap-10 lg:grid-cols-12 relative z-10 pt-6">
        {/* Left Column: Product Info & Presentational Blocks (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full max-w-none lg:max-w-[560px]">
          <BrandPremiumVoucherCard
            brandName={product.brandName || product.name}
            logoUrl={product.logoUrl}
            savingsPercent={
              (selectedSku?.savingsPercent ?? product.savingsPercent ?? 0) > 0
                ? (selectedSku?.savingsPercent ?? product.savingsPercent ?? 0)
                : null
            }
          />

          {/* Product Description & About with Read More logic */}
          {(product.description || product.about) && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm font-medium font-sans text-white/70 leading-relaxed">
                {(() => {
                  const combinedText = [product.description, product.about].filter(Boolean).join(" ");
                  if (combinedText.length <= 150) {
                    return combinedText;
                  }
                  return (
                    <>
                      {isReadMore ? combinedText : `${combinedText.slice(0, 150)}...`}
                      <button
                        type="button"
                        onClick={() => setIsReadMore(!isReadMore)}
                        className="text-white hover:text-white/80 font-bold ml-1 underline underline-offset-2 focus:outline-none"
                      >
                        {isReadMore ? "Read less" : "Read more"}
                      </button>
                    </>
                  );
                })()}
              </p>
            </div>
          )}

          {/* Info cards (Redeem, Expiry, Usage) */}
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3 w-full mt-2">
            {/* REDEEM */}
            <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3 sm:gap-0 p-3 sm:p-3 rounded-[11px] border border-white/10 bg-white/[0.05]">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </div>
              <div className="flex flex-col sm:items-center">
                <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-white sm:mt-3">REDEEM</span>
                <span className="text-[10px] font-medium font-sans text-white/40 mt-1">
                  {product.giftCardInfo?.redemptionType === "ONLINE" ? "Online" : "Online"}
                </span>
              </div>
            </div>

            {/* EXPIRY */}
            <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3 sm:gap-0 p-3 sm:p-3 rounded-[11px] border border-white/10 bg-white/[0.05]">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="flex flex-col sm:items-center">
                <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-white sm:mt-3">EXPIRY</span>
                <span className="text-[10px] font-medium font-sans text-white/40 mt-1">
                  {product.giftCardInfo?.expiryLabel || "1 Year"}
                </span>
              </div>
            </div>

            {/* USAGE */}
            <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3 sm:gap-0 p-3 sm:p-3 rounded-[11px] border border-white/10 bg-white/[0.05]">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
              </div>
              <div className="flex flex-col sm:items-center">
                <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-white sm:mt-3">USAGE</span>
                <span className="text-[10px] font-medium font-sans text-white/40 mt-1">
                  {product.giftCardInfo?.usageSummary || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Underlined "View all T&Cs" Trigger */}
          {product.giftCardInfo?.termsAndConditions && (
            <div className="mt-2 text-left">
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-sm font-semibold font-sans text-white hover:text-white/80 underline underline-offset-2 transition"
              >
                View all T&Cs
              </button>
            </div>
          )}

          {/* How to Redeem container */}
          {(product.giftCardInfo?.howToUseInstructions) && (
            <div className="w-full rounded-2xl border border-white/5 bg-white/[0.06] overflow-hidden mt-4">
              <div className="w-full flex items-center justify-between p-5 font-bold text-sm text-white select-none">
                <span className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 23 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-white/70">
                    <path d="M11.7575 23.6229L11.7698 23.6207C11.7794 23.6222 11.7857 23.6288 11.7886 23.6407L11.8075 24.1151L11.8031 24.134L11.7898 24.1518L11.6742 24.234L11.6609 24.2385L11.6442 24.234L11.5286 24.1518L11.5175 24.1374L11.512 24.1151L11.5309 23.6396L11.5353 23.6285C11.5412 23.6211 11.5501 23.6192 11.562 23.6229L11.6409 23.6618L11.6564 23.6662L11.6786 23.6618L11.7575 23.6229Z" fill="currentColor" />
                    <path d="M12.0498 23.4974L12.0642 23.4951C12.0753 23.4981 12.0827 23.5062 12.0864 23.5196L12.1242 24.2018L12.1198 24.2174C12.1123 24.227 12.1016 24.23 12.0875 24.2262L11.8642 24.1229L11.8553 24.1151L11.8498 24.1018L11.8298 23.624L11.8331 23.6118L11.8442 23.6007L12.0498 23.4974Z" fill="currentColor" />
                    <path d="M11.2534 23.4947C11.259 23.4934 11.2649 23.4944 11.2698 23.4974L11.4742 23.5996L11.4853 23.6107L11.4886 23.624L11.4698 24.1018L11.4653 24.114L11.4542 24.1229L11.2309 24.2262L11.2142 24.2285C11.2023 24.224 11.1961 24.2151 11.1953 24.2018L11.2331 23.5196L11.2398 23.504C11.2429 23.4993 11.2478 23.4959 11.2534 23.4947Z" fill="currentColor" />
                    <path d="M11.1111 0C17.2478 0 22.2222 4.97444 22.2222 11.1111C22.2222 17.2478 17.2478 22.2222 11.1111 22.2222C4.97444 22.2222 0 17.2478 0 11.1111C0 4.97444 4.97444 0 11.1111 0ZM11.1111 2.22222C8.75363 2.22222 6.49271 3.15873 4.82572 4.82572C3.15873 6.49271 2.22222 8.75363 2.22222 11.1111C2.22222 13.4686 3.15873 15.7295 4.82572 17.3965C6.49271 19.0635 8.75363 20 11.1111 20C13.4686 20 15.7295 19.0635 17.3965 17.3965C19.0635 15.7295 20 13.4686 20 11.1111C20 8.75363 19.0635 6.49271 17.3965 4.82572C15.7295 3.15873 13.4686 2.22222 11.1111 2.22222ZM11.1111 15.5556C11.4058 15.5556 11.6884 15.6726 11.8968 15.881C12.1052 16.0894 12.2222 16.372 12.2222 16.6667C12.2222 16.9614 12.1052 17.244 11.8968 17.4523C11.6884 17.6607 11.4058 17.7778 11.1111 17.7778C10.8164 17.7778 10.5338 17.6607 10.3254 17.4523C10.1171 17.244 10 16.9614 10 16.6667C10 16.372 10.1171 16.0894 10.3254 15.881C10.5338 15.6726 10.8164 15.5556 11.1111 15.5556ZM11.1111 5C12.047 5.00003 12.9536 5.32595 13.6753 5.92178C14.397 6.51761 14.8887 7.34615 15.0659 8.26509C15.2431 9.18402 15.0948 10.136 14.6464 10.9575C14.1981 11.7789 13.4776 12.4186 12.6089 12.7667C12.4802 12.814 12.3642 12.8904 12.27 12.99C12.2211 13.0456 12.2133 13.1167 12.2144 13.19L12.2222 13.3333C12.2219 13.6165 12.1135 13.8889 11.9191 14.0949C11.7246 14.3008 11.4589 14.4247 11.1762 14.4413C10.8935 14.4579 10.6151 14.3659 10.398 14.1841C10.1808 14.0024 10.0412 13.7445 10.0078 13.4633L10 13.3333V13.0556C10 11.7744 11.0333 11.0056 11.7822 10.7044C12.087 10.5827 12.3529 10.3803 12.5513 10.1189C12.7497 9.85745 12.8732 9.54692 12.9084 9.22062C12.9437 8.89432 12.8894 8.56459 12.7514 8.26682C12.6133 7.96906 12.3968 7.71452 12.125 7.53053C11.8533 7.34654 11.5365 7.24006 11.2088 7.22252C10.8811 7.20498 10.5547 7.27704 10.2649 7.43097C9.97502 7.58489 9.73256 7.81487 9.56355 8.0962C9.39453 8.37753 9.30534 8.69958 9.30556 9.02778C9.30556 9.32246 9.18849 9.60508 8.98012 9.81345C8.77174 10.0218 8.48913 10.1389 8.19444 10.1389C7.89976 10.1389 7.61714 10.0218 7.40877 9.81345C7.2004 9.60508 7.08333 9.32246 7.08333 9.02778C7.08333 7.95954 7.50769 6.93506 8.26304 6.17971C9.0184 5.42435 10.0429 5 11.1111 5Z" fill="currentColor" />
                  </svg>
                  <span className="font-sans">How to redeem</span>
                </span>
              </div>
              <div className="h-[1px] bg-white/10 mx-5" />
              <div className="p-5 text-xs text-white/70 leading-relaxed flex flex-col gap-3.5 font-sans">
                {product.giftCardInfo.howToUseInstructions?.split("\n").filter(Boolean).map((line, idx) => {
                  const cleaned = line.replace(/^\d+[\.\-\s]*/, "");
                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                        {idx + 1}
                      </span>
                      <p className="flex-1 mt-0.5">{cleaned}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Unified Purchase Flow Details Card (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full lg:sticky lg:top-[90px]">
          <div className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 select-none relative">

            {/* Price and Savings Section */}
            <div className="flex flex-col gap-2 w-full">

              {/* Price display box (rectangular rounded-xl container with border & fill) */}
              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-3 select-none w-full">
                {(() => {
                  const coinsSpent = displayCoinsSpentHeader;
                  if (coinsSpent > 0) {
                    return (
                      <>
                        <div className="flex items-start justify-between w-full">
                          <div className="flex flex-col">
                            <PricingSplitAmountRow cash={displayPrice} coins={coinsSpent} />
                            {displayOriginal > displayPrice && (
                              <span className="text-sm text-white/40 line-through font-medium font-sans tabular-nums mt-1.5 ml-0.5">
                                {formatInr(displayOriginal)}
                              </span>
                            )}
                          </div>
                          {isFlexibleSelection && (
                            <button
                              type="button"
                              onClick={handleEditVoucherWorth}
                              className="text-white/40 hover:text-white transition p-1.5 mt-0.5 -mr-1"
                            >
                              <SquarePen className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <div className="flex items-start justify-between w-full">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="text-[32px] font-bold text-white tracking-tight leading-none">₹</span>
                            <OdometerNumber value={displayPrice} />
                          </div>
                          {displayOriginal > displayPrice && (
                            <span className="text-sm text-white/40 line-through font-medium font-sans tabular-nums mt-0.5 ml-0.5">
                              {formatInr(displayOriginal)}
                            </span>
                          )}
                        </div>
                        {isFlexibleSelection && (
                          <button
                            type="button"
                            onClick={handleEditVoucherWorth}
                            className="text-white/40 hover:text-white transition p-1.5 mt-0.5 -mr-1"
                          >
                            <SquarePen className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
                {savingsPct > 0 && (
                  <span className="text-[13px] font-medium text-[#FE8321] font-sans">
                    You&apos;re saving {formatPercent(savingsPct)}%.
                  </span>
                )}
              </div>

              {/* Quick value chips for flexible selection */}
              {isFlexibleSelection && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {quickSuggestions.map((val) => {
                    const isSelected = customAmount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setCustomAmount(val);
                          setCustomAmountText(String(val));
                        }}
                        className={`h-11 rounded-[9px] flex items-center justify-center text-[15px] font-medium transition ${isSelected
                          ? "bg-white/[0.08] border border-white/20 text-white"
                          : "bg-transparent border border-white/10 text-white hover:bg-white/[0.04]"
                          }`}
                      >
                        ₹{val}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inline Denomination Chips for Fixed SKUs */}
            {!isFlexibleSelection && fixedSkus.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                <span className="text-lg font-bold text-white font-sans">Select amount</span>
                <div className="grid grid-cols-2 gap-3">
                  {fixedSkus.map((sku) => {
                    const isSelected = selectedSku?.id === sku.id;
                    const cardWorth = sku.faceValue ?? sku.unitAmount ?? 0;
                    const payPrice = sku.retailPrice ?? sku.price ?? cardWorth;

                    return (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => setSelectedSku(sku)}
                        className={`p-4 rounded-xl flex flex-col gap-1 text-left border transition ${isSelected
                          ? "bg-white/[0.05] border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                          : "bg-transparent border-white/10 hover:bg-white/[0.02]"
                          }`}
                      >
                        <span className="text-sm font-bold text-white font-sans tabular-nums">
                          {formatInr(cardWorth)}
                        </span>
                        <span className="text-sm font-medium text-[#22C55E] font-sans tabular-nums">
                          {formatInr(payPrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Arena Coins conversion swap & edit */}
            {shouldShowCoinEditor({ paymentRules, sku: selectedSku }) &&
              (optimalCoins > 0 || (isFlexibleSelection && ruleCoinCap > 0 && coinsBalance > 0)) && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 select-none bg-white/[0.05] border border-white/10 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-medium font-sans text-white">
                      <Image src={coinImg} alt="" width={16} height={16} className="object-contain" />
                      {paymentRules?.isCoinOnly ? (
                        <span className="text-[#FE8321] font-semibold">Full payment in Arena Coins required</span>
                      ) : coinsPerRupee != null ? (
                        <span>{coinsPerRupee} Arena Coins = ₹1</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={handleEditCoins}
                      className="flex items-center gap-1.5 bg-white/[0.06] px-2.5 py-1.5 rounded-[6px] text-xs font-semibold text-white hover:bg-white/[0.08] active:scale-95 transition font-sans"
                    >
                      <Image src={coinImg} alt="" width={13} height={13} className="object-contain" />
                      <span className="text-[#F5A623] font-bold">{displayCoinsSpent.toLocaleString()}</span>
                      <SquarePen className="w-3.5 h-3.5 text-white/70 ml-0.5" />
                    </button>
                  </div>
                {isFlexibleSelection &&
                  voucherFaceValue != null &&
                  optimalCoins > 0 &&
                  maxCoinCoveragePercent != null && (
                    <p className="text-[11px] font-medium font-sans text-white/50 px-0.5">
                      Use up to {optimalCoins.toLocaleString()} coins ({formatPercent(maxCoinCoveragePercent)}% of voucher value)
                    </p>
                  )}
                </div>
              )}

            {/* Coupon Code Entry & Applied Box */}
            <div ref={couponFieldRef} className="relative w-full flex flex-col gap-2.5">
              {appliedCoupon ? (
                <div className="flex items-end justify-between bg-white/[0.19] rounded-[11px] p-4 font-sans select-none border border-transparent">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-3">
                      <Image src={voucherIcon} alt="" width={28} height={28} className="object-contain drop-shadow-md" />
                      <span className="text-[14px] font-medium text-white">&lsquo;{appliedCoupon}&rsquo; applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveCoupon();
                        setCouponCode("");
                        setShowCouponModal(true);
                      }}
                      className="text-[12px] font-medium text-white hover:text-white/80 flex items-center gap-1 mt-0.5 text-left animate-in fade-in pl-[40px]"
                    >
                      View all coupons <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 pb-0.5 pr-1">
                    <Check className="w-[18px] h-[18px] text-[#FF6A00] stroke-[3]" />
                    <span className="text-sm font-bold text-[#FF6A00]">Applied</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal();
                      return;
                    }
                    setShowCouponModal(true);
                    void loadMyCoupons();
                  }}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.08] transition select-none font-sans"
                >
                  <div className="flex items-center gap-2.5">
                    <Image src={voucherIcon} alt="" width={24} height={24} className="object-contain" />
                    <span className="text-sm font-semibold text-white">Have a Gift Voucher Code?</span>
                  </div>
                  <span className="text-white text-lg font-bold">+</span>
                </div>
              )}
            </div>

            {/* Buy Action Button & generated value text wrapper box */}
            <div className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col gap-4">
              <span className="text-center text-[13px] font-medium font-sans text-white">
                1 card worth ₹{(isFlexibleSelection ? customAmount : selectedSku?.faceValue ?? selectedSku?.unitAmount ?? 0).toLocaleString("en-IN")} will be generated
              </span>
              <SlantedButton
                type="button"
                onClick={triggerBuy}
                disabled={!selectedSku || !!buyWarning}
                isLoading={previewLoading}
                className="w-full h-12 !text-white !font-bold font-sans tracking-wide"
              >
                {!isAuthenticated ? (
                  <span className="uppercase text-xs">Sign in to Buy</span>
                ) : (
                  <span className="flex items-center justify-center gap-1 text-[15px]">
                    Buy at ₹{displayPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    {displayCoinsSpent > 0 && (
                      <>
                        <span className="ml-0.5">+</span>
                        <Image src={coinImg} alt="" width={16} height={16} className="object-contain" />
                        <span>{displayCoinsSpent.toLocaleString("en-IN")}</span>
                      </>
                    )}
                  </span>
                )}
              </SlantedButton>
              {buyWarning && (
                <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-center text-xs font-semibold text-amber-300">
                  {buyWarning}
                </div>
              )}
            </div>

          </div>



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
          initialCoinsToRedeem={checkoutPreview?.coinsSpent ?? previewCoinsToRedeem}
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
        maxCoins={coinsEditSheetMax}
        initialCoins={displayCoinsSpent}
        coinToInrRate={coinToInrRate ?? 0.01}
        onConfirm={(coins) => {
          setShowEditCoinsModal(false);
          setCustomCoins(coins);
          setApplyCoins(coins > 0);
          void loadPreview();
        }}
      />

      {/* Terms & Conditions Center Popup Modal */}
      {showTerms && product.giftCardInfo?.termsAndConditions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-white/10 border-b-0 sm:border-b rounded-t-2xl sm:rounded-2xl w-full max-w-full sm:max-w-[500px] flex flex-col max-h-[85vh] sm:max-h-[80vh] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-sans">
                <span>📋</span>
                <span>Terms & Conditions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body — same type style as How to redeem */}
            <div className="p-5 overflow-y-auto text-xs text-white/70 leading-relaxed flex flex-col gap-3.5 font-sans">
              {Array.isArray(product.giftCardInfo.termsAndConditions) ? (
                (product.giftCardInfo.termsAndConditions as any).map((term: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 font-sans">
                      {idx + 1}
                    </span>
                    <p className="flex-1 mt-0.5 font-sans">{term}</p>
                  </div>
                ))
              ) : (
                <div className="whitespace-pre-wrap font-sans">{product.giftCardInfo.termsAndConditions}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coupon Center Popup Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#3A3A3A] border border-white/10 border-b-0 sm:border-b rounded-t-[11px] sm:rounded-[11px] w-full max-w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 relative select-none animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Close button at top-right outside/on border */}
            <button
              type="button"
              onClick={() => {
                setShowCouponModal(false);
                setCouponError(null);
              }}
              className="absolute top-4 right-4 rounded-full border border-white/20 p-1 text-white/50 hover:text-white hover:border-white/50 transition flex items-center justify-center bg-black/45"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col gap-1 text-left pr-8">
              <h3 className="text-lg font-bold text-white font-sans">Have a coupon code?</h3>
              <p className="text-xs text-white font-sans">Enter it below to redeem your discount.</p>
            </div>

            {/* Input & Apply Block */}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError(null);
                }}
                placeholder="Enter coupon code"
                autoComplete="off"
                className="h-11 bg-white/[0.1] border border-white/[0.13] rounded-[10.47px] px-4 text-xs font-medium font-sans text-white placeholder:text-white outline-none focus:border-[var(--flame)] focus:ring-0 w-full"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <SlantedButton
                type="button"
                onClick={async () => {
                  if (!couponCode.trim()) return;
                  setCouponError(null);
                  try {
                    await applyCouponCode(couponCode);
                    setShowCouponModal(false);
                  } catch (err) {
                    // error handled inside applyCouponCode
                  }
                }}
                disabled={couponValidating || !couponCode.trim()}
                isLoading={couponValidating}
                className="w-full h-11 uppercase text-xs !text-white !font-bold font-sans tracking-wide"
              >
                Apply
              </SlantedButton>
              {couponError && (
                <p className="text-[10px] font-bold text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 animate-in shake" />
                  {couponError}
                </p>
              )}
            </div>

            {/* Available Coupons list */}
            <div className="flex flex-col gap-3 text-left">
              <h4 className="text-sm font-bold text-white font-sans">Available coupons</h4>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {myCoupons.length > 0 ? (
                  myCoupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      onClick={() => {
                        setCouponCode(coupon.code);
                        setCouponError(null);
                      }}
                      className="bg-white/[0.1] border border-white/10 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-white/[0.12] transition select-none font-sans"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white">
                          <Image src={voucherIcon} alt="" width={24} height={24} className="object-contain" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-white leading-tight">{coupon.code}</span>
                          <span className="text-[10px] text-white/[0.74] leading-none">
                            Min. order {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "₹199"} - Max save {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : "₹1"}
                          </span>
                          <span className="text-[10px] text-white/[0.74] leading-none">
                            Valid till {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "06 Aug 2026"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#FE8321]">
                        {String(coupon.discountType).toLowerCase() === "percentage" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                      </span>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
