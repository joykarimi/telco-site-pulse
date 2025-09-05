
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DollarSign, TowerControl, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSites, Site } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
  },
};

const hoverEffect = {
  scale: 1.05,
  y: -8,
  transition: { type: "spring", stiffness: 300, damping: 15 }
};

export default function Index() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        setLoading(true);
        const sitesData = await getSites();
        setSites(sitesData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch site data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSiteData();
  }, []);

  // Aggregate calculations
  const totalSites = sites.length;
  const totalRevenue = sites.reduce((acc, site) => acc + site.earningsSafaricom + site.earningsAirtel, 0);
  const totalExpenses = sites.reduce((acc, site) => {
    const gridExpense = site.gridConsumption * site.gridUnitCost;
    const fuelExpense = site.fuelConsumption * site.fuelUnitCost;
    const solarExpense = site.solarMaintenanceCost;
    return acc + gridExpense + fuelExpense + solarExpense;
  }, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Chart data
    const profitBySiteData = sites.map(site => {
        const totalEarnings = site.earningsSafaricom + site.earningsAirtel;
        const gridExpense = site.gridConsumption * site.gridUnitCost;
        const fuelExpense = site.fuelConsumption * site.fuelUnitCost;
        const totalExpenses = gridExpense + fuelExpense + site.solarMaintenanceCost;
        const netProfit = totalEarnings - totalExpenses;
        return {
            name: site.name,
            profit: parseFloat(netProfit.toFixed(2)),
            earnings: parseFloat(totalEarnings.toFixed(2)),
            expenses: parseFloat(totalExpenses.toFixed(2)),
        }
    }).sort((a, b) => b.profit - a.profit); // Sort by profit
    
    const financialSummaryData = [
        { name: 'Total Revenue', value: totalRevenue, fill: 'var(--color-green)' },
        { name: 'Total Expenses', value: totalExpenses, fill: 'var(--color-red)' },
        { name: 'Net Profit', value: netProfit, fill: 'var(--color-blue)' },
    ];


  const stats = [
    {
      title: "Total Sites",
      value: totalSites,
      icon: <TowerControl className="h-5 w-5 text-indigo-400" />,
      description: "Number of active sites",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TrendingUp className="h-5 w-5 text-green-400" />,
       description: "Sum of earnings from all sites",
    },
    {
      title: "Net Profit",
      value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: netProfit >= 0 ? <Wallet className="h-5 w-5 text-cyan-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />,
      description: "Revenue minus all expenses",
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
    
  if (error) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive">{error}</p>
        </div>
    );
  }


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
          },
        },
      }}
      className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 dark:from-gray-950 dark:via-slate-900 dark:to-gray-800"
    >
      <motion.div variants={cardVariants}>
        <h2 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.displayName || user?.email}. Here's your financial overview.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div key={index} variants={cardVariants} whileHover={hoverEffect}>
            <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500/40 via-fuchsia-500/40 to-cyan-400/40 shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full">
              <Card className="rounded-[15px] backdrop-blur-xl bg-white/60 dark:bg-slate-800/50 border-none h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-50 dark:to-slate-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div className="grid lg:grid-cols-5 gap-6" variants={cardVariants}>
        <div className="lg:col-span-3 rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-cyan-400/30">
          <Card className="rounded-[15px] backdrop-blur-xl bg-white/60 dark:bg-slate-800/50 border-none h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-tight">Site Profitability</CardTitle>
              <CardDescription>Net profit per site</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitBySiteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                  <XAxis dataKey="name" strokeWidth={0} tick={{fontSize: 12}} />
                  <YAxis strokeWidth={0} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip
                    cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background/90 p-2 shadow-lg backdrop-blur-lg">
                            <p className="font-bold">{label}</p>
                            <p className="text-sm text-green-500">{`Earnings: $${payload[0].payload.earnings.toLocaleString()}`}</p>
                            <p className="text-sm text-red-500">{`Expenses: $${payload[0].payload.expenses.toLocaleString()}`}</p>
                            <p className="text-sm font-bold">{`Profit: $${payload[0].value.toLocaleString()}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="profit" name="Net Profit">
                    {profitBySiteData.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-[1.5px] bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-cyan-400/30">
          <Card className="rounded-[15px] backdrop-blur-xl bg-white/60 dark:bg-slate-800/50 border-none h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-tight">Financial Summary</CardTitle>
              <CardDescription>Overall revenue, expenses, and profit</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialSummaryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" hide tickFormatter={(value) => `$${value/1000}k`} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                             content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background/90 p-2 shadow-lg backdrop-blur-lg">
                                    <p className="text-sm font-bold">{`${payload[0].payload.name}: $${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                            {financialSummaryData.map((entry, index) => (
                                <Bar key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>

    </motion.div>
  );
}
