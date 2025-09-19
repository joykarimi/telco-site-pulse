import { Site, SiteCalculations, CompanySummary, SiteType } from '../types/site';

// Optimized helper function to ensure a value is a number
const ensureNumber = (value: any): number => Number(value) || 0;

// Use a Set for faster lookups
const solarSiteTypes = new Set<SiteType>(['grid-generator-solar', 'generator-solar', 'grid-solar']);

export function calculateSiteProfitLoss(site: Site): SiteCalculations {
  const totalRevenue = ensureNumber(site.safaricomIncome) + ensureNumber(site.airtelIncome) + ensureNumber(site.jtlIncome);
  
  const effectiveGridConsumption = Math.max(0, ensureNumber(site.gridConsumption) - ensureNumber(site.solarContribution));
  const gridExpense = effectiveGridConsumption * ensureNumber(site.gridCostPerKwh);
  
  const fuelExpense = ensureNumber(site.fuelConsumption) * ensureNumber(site.fuelCostPerLiter);
  
  const solarExpense = solarSiteTypes.has(site.type) ? ensureNumber(site.solarMaintenanceCost) : 0;
  
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
    const siteCalculations = sites.map(calculateSiteProfitLoss);

    return siteCalculations.reduce(
        (acc, calculations) => {
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
            netProfitLoss: 0, // This will be calculated after the reduction
            totalSites: sites.length,
            profitableSites: 0,
            lossMakingSites: 0,
        }
    );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ensureNumber(amount));
}

// Use a Map for faster lookups
const siteTypeLabels = new Map<SiteType, string>([
  ['grid-only', 'Grid Only'],
  ['grid-generator', 'Grid + Generator'],
  ['grid-generator-solar', 'Grid + Generator + Solar'],
  ['generator-only', 'Generator Only'],
  ['generator-solar', 'Generator + Solar'],
  ['grid-solar', 'Grid + Solar'],
]);

export function getSiteTypeLabel(type: SiteType): string {
  return siteTypeLabels.get(type) || type;
}