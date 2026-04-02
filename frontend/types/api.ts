export type Role = "viewer" | "analyst" | "admin";
export type RecordType = "income" | "expense";

export const RECORD_TYPES: RecordType[] = ["income", "expense"];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type RecordItem = {
  id: string;
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string | null;
  created_by?: string;
  is_deleted?: boolean;
};

export type DashboardData = {
  overview: {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    total_records: number;
  };
  by_category: Array<{ category: string; type: string; total: number }>;
  recent_activity: Array<{ id: string; amount: number; type: RecordType; date: string; category?: string; notes?: string | null }>;
};

export type TrendPoint = {
  month: string;
  income: number;
  expenses: number;
  count: number;
};

export type TrendWeek = {
  week: string;
  income: number;
  expenses: number;
  count: number;
};

export const RECORD_CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "rent",
  "utilities",
  "food",
  "transport",
  "healthcare",
  "education",
  "entertainment",
  "shopping",
  "insurance",
  "tax",
  "other",
] as const;
