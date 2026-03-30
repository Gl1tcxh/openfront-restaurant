"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CheckoutPaymentStateValue = {
  cardComplete: boolean;
  setCardComplete: (complete: boolean) => void;
  cardBrand: string | null;
  setCardBrand: (brand: string | null) => void;
};

const CheckoutPaymentStateContext = createContext<CheckoutPaymentStateValue | null>(null);

export function CheckoutPaymentStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cardComplete, setCardComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      cardComplete,
      setCardComplete,
      cardBrand,
      setCardBrand,
    }),
    [cardBrand, cardComplete]
  );

  return (
    <CheckoutPaymentStateContext.Provider value={value}>
      {children}
    </CheckoutPaymentStateContext.Provider>
  );
}

export function useCheckoutPaymentState() {
  const context = useContext(CheckoutPaymentStateContext);

  if (!context) {
    throw new Error("useCheckoutPaymentState must be used within CheckoutPaymentStateProvider");
  }

  return context;
}
