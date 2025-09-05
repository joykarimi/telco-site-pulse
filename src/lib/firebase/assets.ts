
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

export interface Asset {
  id: string;
  serialNumber: string;
  type: string;
  site: string;
  status: "Active" | "In Repair" | "Retired";
  purchaseDate?: Date;
  installationDate?: Date;
}

export type NewAsset = Omit<Asset, 'id'>;

export async function getAssets(): Promise<Asset[]> {
  const assetsCol = collection(db, "assets");
  const assetSnapshot = await getDocs(assetsCol);
  const assetList = assetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
  return assetList;
}

export async function addAsset(asset: NewAsset): Promise<void> {
  const assetsCol = collection(db, "assets");
  await addDoc(assetsCol, asset);
}
