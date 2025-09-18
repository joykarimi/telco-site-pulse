import { Site, SiteCalculations, CompanySummary } from '../types/site';

// Helper function to ensure a value is a number, defaulting to 0 if null, undefined, or NaN
function ensureNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function calculateSiteProfitLoss(site: Site): SiteCalculations {
  const safaricomIncome = ensureNumber(site.safaricomIncome);
  const airtelIncome = ensureNumber(site.airtelIncome);
  const jtlIncome = ensureNumber(site.jtlIncome);

  const totalRevenue = safaricomIncome + airtelIncome + jtlIncome;
  
  // Grid expense (reduced by solar contribution if applicable)
  const gridConsumption = ensureNumber(site.gridConsumption);
  const solarContribution = ensureNumber(site.solarContribution);
  const gridCostPerKwh = ensureNumber(site.gridCostPerKwh);

  const effectiveGridConsumption = solarContribution > 0 
    ? Math.max(0, gridConsumption - solarContribution)
    : gridConsumption;
  const gridExpense = effectiveGridConsumption * gridCostPerKwh;
  
  // Fuel expense
  const fuelConsumption = ensureNumber(site.fuelConsumption);
  const fuelCostPerLiter = ensureNumber(site.fuelCostPerLiter);
  const fuelExpense = fuelConsumption * fuelCostPerLiter;
  
  // Solar maintenance expense (only if site has solar)
  const solarMaintenanceCost = ensureNumber(site.solarMaintenanceCost);
  const solarExpense = ['grid-generator-solar', 'generator-solar', 'grid-solar'].includes(site.type)
    ? solarMaintenanceCost
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
      acc.totalRevenue = ensureNumber(acc.totalRevenue) + ensureNumber(calculations.totalRevenue);
      acc.totalExpense = ensureNumber(acc.totalExpense) + ensureNumber(calculations.totalExpense);
      if (ensureNumber(calculations.netProfitLoss) > 0) {
        acc.profitableSites++;
      } else if (ensureNumber(calculations.netProfitLoss) < 0) {
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

  summary.netProfitLoss = ensureNumber(summary.totalRevenue) - ensureNumber(summary.totalExpense);
  return summary;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ensureNumber(amount));
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