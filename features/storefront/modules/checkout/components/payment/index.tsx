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
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RiLoader2Fill } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface PaymentProps {
  cart: {
    id: string;
    total: number;
    paymentCollection?: {
      paymentSessions?: Array<{
        id: string;
        isSelected: boolean;
        status?: string;
        paymentProvider: {
          code: string;
        };
      }>;
    };
    orderType: string;
  };
  availablePaymentMethods: Array<{
    id: string;
    code: string;
  }>;
}

const Payment = ({ cart, availablePaymentMethods }: PaymentProps) => {
  const activeSession = cart.paymentCollection?.paymentSessions?.find(
    (session) => session.isSelected
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.paymentProvider?.code ?? ""
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = searchParams?.get("step") === "payment";

  const isStripePayment = isStripe(selectedPaymentMethod);
  const stripeReady = useContext(StripeContext);

  const isSandboxMode = isStripeSandbox() || isPayPalSandbox();

  const paymentReady = !!activeSession;

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
      const shouldInputCard = isStripe(selectedPaymentMethod) && !cardComplete;

      const hasExistingSelectedSession =
        cart.paymentCollection?.paymentSessions?.some(
          (session) =>
            session.isSelected &&
            session.paymentProvider.code === selectedPaymentMethod &&
            session.status !== "error"
        );

      if (!hasExistingSelectedSession) {
        await initiatePaymentSession(cart.id, selectedPaymentMethod);
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
  }, [isOpen]);

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

          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={!selectedPaymentMethod || isLoading}
            data-testid="submit-payment-button"
            className="mt-5 w-full rounded-xl h-12 font-semibold"
          >
            {isLoading && <RiLoader2Fill className="mr-2 h-4 w-4 animate-spin" />}
            {isStripePayment && !cardComplete
              ? "Enter card details"
              : "Continue to Review"}
          </Button>
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
                      : "Another step will appear"}
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
