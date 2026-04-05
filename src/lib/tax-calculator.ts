export const PERSONAL_DEDUCTION = 11_000_000;
export const DEPENDENT_DEDUCTION = 4_400_000;

export function calculatePIT(totalIncome: number, taxExempt: number, insurance: number, dependentCount: number) {
  const deductibles = PERSONAL_DEDUCTION + (dependentCount * DEPENDENT_DEDUCTION) + insurance;
  const taxableIncome = Math.max(0, totalIncome - taxExempt - deductibles);
  
  let tax = 0;
  
  // Tiers (M = Milion)
  if (taxableIncome <= 5_000_000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 10_000_000) {
    tax = 5_000_000 * 0.05 + (taxableIncome - 5_000_000) * 0.10;
  } else if (taxableIncome <= 18_000_000) {
    tax = 5_000_000 * 0.05 + 5_000_000 * 0.10 + (taxableIncome - 10_000_000) * 0.15;
  } else if (taxableIncome <= 32_000_000) {
    tax = 5_000_000 * 0.05 + 5_000_000 * 0.10 + 8_000_000 * 0.15 + (taxableIncome - 18_000_000) * 0.20;
  } else if (taxableIncome <= 52_000_000) {
    tax = 5_000_000 * 0.05 + 5_000_000 * 0.10 + 8_000_000 * 0.15 + 14_000_000 * 0.20 + (taxableIncome - 32_000_000) * 0.25;
  } else if (taxableIncome <= 80_000_000) {
    tax = 5_000_000 * 0.05 + 5_000_000 * 0.10 + 8_000_000 * 0.15 + 14_000_000 * 0.20 + 20_000_000 * 0.25 + (taxableIncome - 52_000_000) * 0.30;
  } else {
    tax = 5_000_000 * 0.05 + 5_000_000 * 0.10 + 8_000_000 * 0.15 + 14_000_000 * 0.20 + 20_000_000 * 0.25 + 28_000_000 * 0.30 + (taxableIncome - 80_000_000) * 0.35;
  }
  
  return {
    taxableIncome,
    taxAmount: tax
  };
}
