import { loadStripe } from '@stripe/stripe-js';
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';

let stripePromise;
export function getStripe(publishableKey) {
  if (!stripePromise || stripePromise._pk !== publishableKey) {
    stripePromise = loadStripe(publishableKey);
    stripePromise._pk = publishableKey;
  }
  return stripePromise;
}

export function StripeProvider({ publishableKey, children }) {
  if (!publishableKey) return null;
  return React.createElement(
    Elements,
    { stripe: getStripe(publishableKey) },
    children
  );
}
