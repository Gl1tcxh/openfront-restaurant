/**
 * Formats a cent amount into a dollar string
 * @param cents Amount in cents
 * @returns Formatted currency string (e.g., "$12.99")
 */
export function formatCurrency(cents: number | string): string {
  const amount = typeof cents === 'string' ? parseInt(cents, 10) : cents;
  if (isNaN(amount)) return '$0.00';
  return `$${(amount / 100).toFixed(2)}`;
}

/**
 * Converts a dollar amount to cents
 * @param dollars Amount in dollars (e.g., 12.99)
 * @returns Amount in cents (e.g., 1299)
 */
export function toCents(dollars: number | string): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}
