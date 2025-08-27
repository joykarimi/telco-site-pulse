export type SiteType = 
  | 'grid-only'
  | 'grid-generator'
  | 'grid-generator-solar'
  | 'generator-only'
  | 'generator-solar'
  | 'grid-solar';

export interface Site {
  id: string;
  name: string;
  type: SiteType;
  revenueType?: 'colocated' | 'safaricom_only' | 'airtel_only';
  
  // Earnings
  safaricomIncome: number;
  airtelIncome: number;
  
  // Consumption
  gridConsumption: number; // KWh
  fuelConsumption: number; // liters
  solarContribution: number; // KWh or % reduction
  
  // Unit costs
  gridCostPerKwh: number;
  fuelCostPerLiter: number;
  solarMaintenanceCost: number;
}

export interface SiteCalculations {
  totalRevenue: number;
  gridExpense: number;
  fuelExpense: number;
  solarExpense: number;
  totalExpense: number;
  netProfitLoss: number;
  profitMargin: number;
}

export interface CompanySummary {
  totalRevenue: number;
  totalExpense: number;
  netProfitLoss: number;
  totalSites: number;
  profitableSites: number;
  lossMakingSites: number;
}