"use client";

import React from "react";
import { CheckoutView } from "@/components/patisserie/CheckoutView";
import { usePatisserieCart } from "@/lib/patisserieCart";
import { PipingBagCursor } from "@/components/patisserie/PipingBagCursor";

export default function CheckoutPage() {
  const { cart, updateItemQty, clearCart } = usePatisserieCart();

  return (
    <>
      <CheckoutView
        cart={cart}
        onUpdateQty={updateItemQty}
        onClearCart={clearCart}
      />
      <PipingBagCursor />
    </>
  );
}
