import { Site, SiteCalculations, CompanySummary } from '../types/site';

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
  const summary = sites.reduce(
    (acc, site) => {
      const calculations = calculateSiteProfitLoss(site);
      acc.totalRevenue += calculations.totalRevenue;
      acc.totalExpense += calculations.totalExpense;
      if (calculations.netProfitLoss > 0) {
        acc.profitableSites++;
      } else if (calculations.netProfitLoss < 0) {
        acc.lossMakingSites++;
      }
      return acc;
    },
    {
      totalRevenue: 0,
      totalExpense: 0,
      netProfitLoss: 0,
      totalSites: sites.length,
      profitableSites: 0,
      lossMakingSites: 0,
    }
  );

  summary.netProfitLoss = summary.totalRevenue - summary.totalExpense;
  return summary;
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