"use client";
import { isStripe, paymentInfoMap, isStripeSandbox, isPayPalSandbox } from "@/features/storefront/lib/constants";
import { initiatePaymentSession } from "@/features/storefront/lib/data/payment";
import { CircleCheck, CreditCard, FlaskConical, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ErrorMessage from "../error-message";
import { StripeContext } from "../payment-wrapper/stripe-wrapper";
import { CardElement } from "@stripe/react-stripe-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { RiLoader2Fill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { setCheckoutTip } from "@/features/storefront/lib/data/cart";
import { Loader2 } from "lucide-react";
import { calculateRestaurantTotals } from "@/features/lib/restaurant-order-pricing";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { useCheckoutPaymentState } from "../checkout-state";

interface PaymentProps {
  cart: {
    id: string;
    total: number;
    subtotal?: number;
    tipPercent?: string | number;
    paymentCollection?: {
      paymentSessions?: Array<{
        id: string;
        isSelected: boolean;
        amount: number;
        status?: string;
        paymentProvider: {
          code: string;
        };
      }>;
    };
    orderType: string;
  };
  storeSettings: any;
  availablePaymentMethods: Array<{
    id: string;
    code: string;
  }>;
}

const TIP_OPTIONS = ["0", "15", "18", "20", "25"] as const;

const Payment = ({ cart, availablePaymentMethods, storeSettings }: PaymentProps) => {
  const activeSession = cart.paymentCollection?.paymentSessions?.find(
    (session) => session.isSelected
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.paymentProvider?.code ?? ""
  );
  const { cardBrand, setCardBrand, cardComplete, setCardComplete } =
    useCheckoutPaymentState();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isTipPending, startTipTransition] = useTransition();

  const currentStep = searchParams?.get("step");
  const isOpen = currentStep === "payment" || currentStep === "review";

  const isStripePayment = isStripe(selectedPaymentMethod);
  const stripeReady = useContext(StripeContext);

  const isSandboxMode = isStripeSandbox() || isPayPalSandbox();
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  }
  const deliveryPricing = useMemo(
    () =>
      calculateRestaurantTotals({
        subtotal: Number(cart?.subtotal || 0),
        orderType: cart?.orderType,
        tipPercent: Number(cart?.tipPercent || 0),
        deliveryFee: storeSettings?.deliveryFee,
        deliveryMinimum: storeSettings?.deliveryMinimum,
        pickupDiscountPercent: Number(storeSettings?.pickupDiscount || 0),
        taxRate: Number(storeSettings?.taxRate || 0),
        currencyCode: currencyConfig.currencyCode,
      }),
    [
      cart?.subtotal,
      cart?.orderType,
      cart?.tipPercent,
      storeSettings?.deliveryFee,
      storeSettings?.deliveryMinimum,
      storeSettings?.pickupDiscount,
      storeSettings?.taxRate,
      currencyConfig.currencyCode,
    ]
  )
  const deliveryMinimumNotMet =
    cart?.orderType === "delivery" && deliveryPricing.deliveryMinimumNotMet

  const activeSessionMatchesTotal = Boolean(
    activeSession &&
      activeSession.amount === deliveryPricing.total &&
      activeSession.status !== "error"
  );
  const selectedSessionMatchesTotal =
    activeSessionMatchesTotal && activeSession?.paymentProvider?.code === selectedPaymentMethod;
  const paymentReady = selectedSessionMatchesTotal;

  const useOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          color: "#3d2e1e",
          "::placeholder": {
            color: "rgb(128 115 100)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-12 px-4 mt-0 bg-background border rounded-lg appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-border hover:bg-muted/50 transition-all duration-300 ease-in-out",
      },
      hidePostalCode: true,
    };
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (deliveryMinimumNotMet) {
        throw new Error(
          `Delivery requires a minimum subtotal of ${formatCurrency(storeSettings?.deliveryMinimum || 0, currencyConfig, {
            inputIsCents: false,
          })}. Add ${formatCurrency(deliveryPricing.deliveryMinimumShortfall, currencyConfig)} more or switch to pickup.`
        )
      }

      if (!selectedSessionMatchesTotal) {
        await initiatePaymentSession(cart.id, selectedPaymentMethod);
        router.replace(pathname + "?" + createQueryString("step", "payment"), {
          scroll: false,
        });
        router.refresh();
        return;
      }

      if (isStripe(selectedPaymentMethod) && !cardComplete) {
        throw new Error("Enter your card details to continue.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = Number(cart?.subtotal || 0);
  const tipPercent = String(cart?.tipPercent || "0");

  const handleTipChange = (nextTipPercent: string) => {
    if (nextTipPercent === tipPercent || isTipPending) {
      return;
    }

    startTipTransition(async () => {
      const result = await setCheckoutTip(nextTipPercent);
      if (result.success) {
        router.refresh();
      }
    });
  };

  useEffect(() => {
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isStripe(selectedPaymentMethod)) {
      setCardComplete(false);
      setCardBrand(null);
    }
  }, [selectedPaymentMethod, setCardBrand, setCardComplete]);

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-warm-100 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-warm-700" />
          </div>
          <h2
            className={cn(
              "font-serif font-bold text-xl tracking-tight",
              {
                "text-muted-foreground":
                  !isOpen && !paymentReady,
              }
            )}
          >
            Payment
          </h2>
          {!isOpen && paymentReady && <CircleCheck className="h-4 w-4 text-green-600" />}
        </div>
        {!isOpen && paymentReady && (
          <Button
            onClick={handleEdit}
            data-testid="edit-payment-button"
            variant="ghost"
            size="sm"
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            Edit
          </Button>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {/* Tipping Section */}
          <div className="mb-6 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Tip the team</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional for both pickup and delivery.
                </p>
              </div>
              {isTipPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {TIP_OPTIONS.map((option) => {
                const optionTip = Math.round(subtotal * (Number(option) / 100));
                const selected = tipPercent === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleTipChange(option)}
                    disabled={isTipPending}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-warm-200 hover:bg-muted/40"
                    )}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {option}%
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {option === "0"
                        ? "No tip"
                        : formatCurrency(optionTip, currencyConfig)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {availablePaymentMethods?.length > 0 && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
                className="space-y-2"
              >
                {availablePaymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="relative"
                  >
                    <RadioGroupItem
                      value={method.code}
                      id={method.id}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={method.id}
                      className={cn(
                        "flex items-center justify-between text-sm font-normal cursor-pointer py-4 border rounded-xl px-5 transition-all",
                        {
                          "border-primary bg-primary/5 shadow-sm": selectedPaymentMethod === method.code,
                          "border-border hover:border-warm-200 hover:bg-muted/30": selectedPaymentMethod !== method.code,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <div className={cn(
                          "w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors",
                          {
                            "border-primary": selectedPaymentMethod === method.code,
                            "border-border": selectedPaymentMethod !== method.code,
                          }
                        )}>
                          {selectedPaymentMethod === method.code && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {paymentInfoMap[method.code]?.title || method.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-3">
                        {isSandboxMode && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-warm-100 text-warm-700 border border-warm-200">
                                  <FlaskConical className="w-3 h-3" strokeWidth={2.5} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sandbox environment – do not enter real payment info</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <div className="w-5 h-5 flex items-center justify-center">
                          {paymentInfoMap[method.code]?.icon}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {isStripePayment && stripeReady && (
                <div className="mt-4 transition-all duration-150 ease-in-out">
                  <p className="text-sm font-semibold mb-2">
                    Card details
                  </p>
                  <CardElement
                    options={useOptions}
                    onChange={(e) => {
                      if (e.brand) {
                        setCardBrand(e.brand.charAt(0).toUpperCase() + e.brand.slice(1));
                      }
                      setError(e.error?.message || null);
                      setCardComplete(e.complete);
                    }}
                  />
                </div>
              )}
            </>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />
          {deliveryMinimumNotMet ? (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-amber-800">
                Delivery requires a minimum subtotal of{" "}
                {formatCurrency(storeSettings?.deliveryMinimum || 0, currencyConfig, {
                  inputIsCents: false,
                })}
                .
              </p>
              <p className="mt-1 text-xs text-amber-700/90">
                Add {formatCurrency(deliveryPricing.deliveryMinimumShortfall, currencyConfig)} more or switch this order to pickup.
              </p>
            </div>
          ) : null}

          {!selectedSessionMatchesTotal ? (
            <Button
              onClick={handleSubmit}
              size="lg"
              disabled={!selectedPaymentMethod || isLoading || deliveryMinimumNotMet}
              data-testid="submit-payment-button"
              className="mt-5 w-full rounded-xl h-12 font-semibold"
            >
              {isLoading && <RiLoader2Fill className="mr-2 h-4 w-4 animate-spin" />}
              Set up payment
            </Button>
          ) : null}
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-x-8 pl-11">
              <div className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Payment method
                </p>
                <p
                  className="text-sm text-foreground"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    selectedPaymentMethod}
                </p>
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Details
                </p>
                <div
                  className="flex gap-2 text-sm text-muted-foreground items-center"
                  data-testid="payment-details-summary"
                >
                  <div className="flex items-center h-7 w-fit p-2 bg-muted/50 border border-border/50 rounded-lg">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </div>
                  <span>
                    {isStripe(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Ready in order summary"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Payment;
