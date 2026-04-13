/** Format a number as Indian Rupees */
export const inr = (amount, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0);

/** Short form: ₹1.2L, ₹3.5Cr */
export const inrShort = (amount) => {
  const n = Math.abs(amount || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toFixed(2)}`;
};
