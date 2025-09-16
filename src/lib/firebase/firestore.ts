
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { AssetType } from "@/lib/asset-types";

// Asset Management Interfaces and Functions
export interface Asset {
  id: string;
  serialNumber: string;
  type: AssetType;
  site: string;
  status: string;
  purchaseDate?: Date;
  installationDate?: Date;
}

export async function isSerialNumberUnique(serialNumber: string): Promise<boolean> {
    const q = query(collection(db, "assets"), where("serialNumber", "==", serialNumber));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

export async function getAssets(): Promise<Asset[]> {
  const querySnapshot = await getDocs(collection(db, "assets"));
  return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate(),
          installationDate: data.installationDate?.toDate(),
        } as Asset
    });
}

export async function addAsset(assetData: Omit<Asset, 'id' | 'site'> & { site?: string }): Promise<void> {
    await addDoc(collection(db, "assets"), { ...assetData, site: assetData.site || 'Unassigned' });
}

export async function updateAsset(assetId: string, assetData: Partial<Omit<Asset, 'id'>>): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await updateDoc(assetRef, assetData);
}

export async function deleteAsset(assetId: string): Promise<void> {
    const assetRef = doc(db, "assets", assetId);
    await deleteDoc(assetRef);
}

export async function deleteAllAssets(): Promise<void> {
    const assetsCollection = collection(db, "assets");
    const assetSnapshot = await getDocs(assetsCollection);
    const batch = writeBatch(db);
    assetSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


// Asset Movement Interfaces and Functions
export type AssetMovementStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AssetMovement {
    id: string;
    assetId: string;
    fromSite: string;
    toSite: string;
    requestedBy: string; 
    status: AssetMovementStatus;
    reason?: string;
}

export async function getAssetMovements(): Promise<AssetMovement[]> {
    const querySnapshot = await getDocs(collection(db, "asset_movements"));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AssetMovement));
}

export async function requestAssetMovement(movementData: Omit<AssetMovement, 'id' | 'status' | 'requestedBy'> & { requestedBy: string }): Promise<void> {
    await addDoc(collection(db, "asset_movements"), { ...movementData, status: 'Pending' });
}

export async function updateAssetMovementStatus(movementId: string, status: 'Approved' | 'Rejected'): Promise<void> {
    const movementRef = doc(db, "asset_movements", movementId);
    await updateDoc(movementRef, { status });
}

export async function updateAssetMovement(movementId: string, movementData: Partial<Omit<AssetMovement, 'id'>>): Promise<void> {
    const movementRef = doc(db, "asset_movements", movementId);
    await updateDoc(movementRef, movementData);
}

export async function deleteAssetMovement(movementId: string): Promise<void> {
    const movementRef = doc(db, "asset_movements", movementId);
    await deleteDoc(movementRef);
}


// Site Management Interfaces and Functions
export interface SiteDefinition {
    id: string;
    name: string;
    type: string;
}

export interface SiteMonthlyData {
    id: string;
    siteId: string;
    month: number;
    year: number;
    gridConsumption: number;
    fuelConsumption: number;
    solarContribution: string;
    earningsSafaricom: number;
    earningsAirtel: number;
    earningsJtl: number;
    gridUnitCost: number;
    fuelUnitCost: number;
    solarMaintenanceCost: number;
}

export interface CombinedSiteData extends SiteDefinition {
    monthlyData: Omit<SiteMonthlyData, 'id' | 'siteId'> | null;
}

export async function getSiteDefinitions(): Promise<SiteDefinition[]> {
    const q = query(collection(db, "siteDefinitions"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteDefinition));
}

export async function addSiteDefinition(siteData: Omit<SiteDefinition, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "siteDefinitions"), siteData);
    return docRef.id;
}

export async function getSiteMonthlyData(month: number, year: number): Promise<SiteMonthlyData[]> {
    const q = query(collection(db, "siteMonthlyData"), where("month", "==", month), where("year", "==", year));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteMonthlyData));
}

export async function addSiteMonthlyData(data: Omit<SiteMonthlyData, 'id'>): Promise<void> {
    await addDoc(collection(db, "siteMonthlyData"), data);
}

export async function addMultipleSitesWithMonthlyData(sitesData: any[], month: number, year: number): Promise<void> {
    const batch = writeBatch(db);
    const siteDefinitions = await getSiteDefinitions();
    const siteNameToId = new Map(siteDefinitions.map(s => [s.name.toLowerCase(), s.id]));

    for (const row of sitesData) {
        let siteId = siteNameToId.get(row.Site.toLowerCase());

        if (!siteId) {
            const newSiteDefRef = doc(collection(db, "siteDefinitions"));
            batch.set(newSiteDefRef, { name: row.Site, type: row.Type });
            siteId = newSiteDefRef.id;
            siteNameToId.set(row.Site.toLowerCase(), siteId);
        }

        const monthlyDataRef = doc(collection(db, "siteMonthlyData"));
        batch.set(monthlyDataRef, {
            siteId,
            month,
            year,
            earningsSafaricom: parseFloat(row.Safaricom || 0),
            earningsAirtel: parseFloat(row.Airtel || 0),
            earningsJtl: parseFloat(row.JTL || 0),
            gridConsumption: parseFloat(row['Grid Expense'] || 0),
            gridUnitCost: 1,
            fuelConsumption: parseFloat(row['Fuel Expense'] || 0),
            fuelUnitCost: 1,
            solarMaintenanceCost: parseFloat(row['Solar Expense'] || 0),
            solarContribution: '0'
        });
    }

    await batch.commit();
}


export async function updateSiteMonthlyData(monthlyDataId: string, data: Partial<Omit<SiteMonthlyData, 'id'>>): Promise<void> {
    const monthlyDataRef = doc(db, "siteMonthlyData", monthlyDataId);
    await updateDoc(monthlyDataRef, data);
}

export async function deleteSiteDefinition(siteId: string): Promise<void> {
    const batch = writeBatch(db);
    const siteRef = doc(db, "siteDefinitions", siteId);

    // Get site name to find associated assets
    const siteDoc = await getDoc(siteRef);
    if (!siteDoc.exists()) {
        throw new Error("Site not found");
    }
    const siteName = siteDoc.data().name;

    // Delete the site definition
    batch.delete(siteRef);

    // Delete all associated monthly data
    const monthlyDataQuery = query(collection(db, "siteMonthlyData"), where("siteId", "==", siteId));
    const monthlyDataSnapshot = await getDocs(monthlyDataQuery);
    monthlyDataSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Delete all associated assets
    const assetsQuery = query(collection(db, "assets"), where("site", "==", siteName));
    const assetsSnapshot = await getDocs(assetsQuery);
    assetsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}
