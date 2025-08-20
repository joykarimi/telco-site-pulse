import { Site, SiteCalculations, CompanySummary } from '@/types/site';

export function calculateSiteProfitLoss(site: Site): SiteCalculations {
  const totalRevenue = site.safaricomIncome + site.airtelIncome;
  
  // Grid expense (reduced by solar contribution if applicable)
  const effectiveGridConsumption = site.solarContribution > 0 
    ? Math.max(0, site.gridConsumption - site.solarContribution)
    : site.gridConsumption;
  const gridExpense = effectiveGridConsumption * site.gridCostPerKwh;
  
  // Fuel expense
  const fuelExpense = site.fuelConsumption * site.fuelCostPerLiter;
  
  // Solar maintenance expense (only if site has solar)
  const solarExpense = ['grid-generator-solar', 'generator-solar', 'grid-solar'].includes(site.type)
    ? site.solarMaintenanceCost
    : 0;
  
  const totalExpense = gridExpense + fuelExpense + solarExpense;
  const netProfitLoss = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? (netProfitLoss / totalRevenue) * 100 : 0;
  
  return {
    totalRevenue,
    gridExpense,
    fuelExpense,
    solarExpense,
    totalExpense,
    netProfitLoss,
    profitMargin,
  };
}

export function calculateCompanySummary(sites: Site[]): CompanySummary {
  const calculations = sites.map(calculateSiteProfitLoss);
  
  const totalRevenue = calculations.reduce((sum, calc) => sum + calc.totalRevenue, 0);
  const totalExpense = calculations.reduce((sum, calc) => sum + calc.totalExpense, 0);
  const netProfitLoss = totalRevenue - totalExpense;
  
  const profitableSites = calculations.filter(calc => calc.netProfitLoss > 0).length;
  const lossMakingSites = calculations.filter(calc => calc.netProfitLoss < 0).length;
  
  return {
    totalRevenue,
    totalExpense,
    netProfitLoss,
    totalSites: sites.length,
    profitableSites,
    lossMakingSites,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSiteTypeLabel(type: string): string {
  const labels = {
    'grid-only': 'Grid Only',
    'grid-generator': 'Grid + Generator',
    'grid-generator-solar': 'Grid + Generator + Solar',
    'generator-only': 'Generator Only',
    'generator-solar': 'Generator + Solar',
    'grid-solar': 'Grid + Solar',
  };
  return labels[type as keyof typeof labels] || type;
}