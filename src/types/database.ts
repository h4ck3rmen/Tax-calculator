export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  department: string | null;
  tax_code: string | null;
  id_card: string | null;
  is_resigned: boolean;
  user_id: string;
  created_at: string;
}

export interface Dependent {
  id: string;
  employee_id: string;
  full_name: string;
  relationship: string | null;
  date_of_birth: string | null;
  tax_code: string | null;
  id_card: string | null;
  deduction_start_month: string | null;
  deduction_end_month: string | null;
  is_inactive: boolean;
  user_id: string;
  created_at: string;
}

export interface MonthlyTaxRecord {
  id: string;
  employee_id: string;
  month_year: string;
  total_income: number;
  tax_exempt_income: number;
  insurance_deduction: number;
  dependent_count: number;
  taxable_income: number;
  tax_amount: number;
  user_id: string;
  created_at: string;
}
