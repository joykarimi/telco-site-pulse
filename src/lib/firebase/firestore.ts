
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";

// Asset Management Interfaces and Functions
export interface Asset {
  id: string;
  serialNumber: string;
  type: string;
  site: string;
  status: string;
  purchaseDate?: Date;
  installationDate?: Date;
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


// Site Management Interfaces and Functions
export interface Site {
    id: string;
    name: string;
    type: string;
    gridConsumption: number;
    fuelConsumption: number;
    solarContribution: string; // Can be KWh or %
    earningsSafaricom: number;
    earningsAirtel: number;
    gridUnitCost: number;
    fuelUnitCost: number;
    solarMaintenanceCost: number;
}

export async function getSites(): Promise<Site[]> {
    const querySnapshot = await getDocs(collection(db, "sites"));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Site));
}

export async function addSite(siteData: Omit<Site, 'id'>): Promise<void> {
    await addDoc(collection(db, "sites"), siteData);
}

