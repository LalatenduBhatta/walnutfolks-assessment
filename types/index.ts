// types/index.ts
export interface Transaction {
  id?: string;
  transaction_id: string;
  source_account: string;
  destination_account: string;
  amount: number;
  currency: string;
  status: 'PROCESSING' | 'PROCESSED';
  created_at: string;
  processed_at: string | null;
  updated_at?: string;
}

export interface WebhookPayload {
  transaction_id: string;
  source_account: string;
  destination_account: string;
  amount: number;
  currency?: string;
}

// Recharts compatible types with index signature
export interface ChartDataItem {
  name: string;
  value?: number;
  duration?: number;
  // Index signature for Recharts compatibility
  [key: string]: any;
}

export interface ChartData {
  callDuration: ChartDataItem[];
  sadPath: ChartDataItem[];
}

export interface UserChartData {
  id?: string;
  email: string;
  chart_data: ChartData;
  created_at?: string;
  updated_at?: string;
}