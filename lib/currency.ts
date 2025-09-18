// Currency formatting utilities for Indian Rupees
export function formatCurrency(amountInCents: number): string {
  const amountInRupees = amountInCents / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountInRupees);
}

export function formatPrice(amountInCents: number): string {
  const amountInRupees = amountInCents / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInRupees);
}

export function formatPriceWithDecimals(amountInCents: number): string {
  const amountInRupees = amountInCents / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInRupees);
}

// Convert USD cents to INR cents (approximate conversion for demo)
// In production, use real-time exchange rates
export function convertUsdToInr(usdCents: number): number {
  const USD_TO_INR_RATE = 83; // Approximate rate
  return Math.round(usdCents * USD_TO_INR_RATE);
}
