
import { Site } from "@/types/site";

export interface MonthlyData {
    month: number; // 1-12
    year: number;
    sites: Site[];
}

export const mockMonthlyData: MonthlyData[] = [];
