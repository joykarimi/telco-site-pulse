
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export interface AssetMovement {
  id: string;
  asset: string;
  from: string;
  to: string;
  requestedBy: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: Date;
}

export type NewAssetMovement = Omit<AssetMovement, 'id' | 'createdAt' | 'status'>;

export async function getAssetMovements(): Promise<AssetMovement[]> {
  const movementsCol = collection(db, "asset_movements");
  const q = query(movementsCol, orderBy("createdAt", "desc"));
  const movementSnapshot = await getDocs(q);
  const movementList = movementSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as AssetMovement;
  });
  return movementList;
}

export async function requestAssetMovement(movement: NewAssetMovement): Promise<void> {
  const movementsCol = collection(db, "asset_movements");
  await addDoc(movementsCol, {
    ...movement,
    status: "Pending",
    createdAt: serverTimestamp(),
  });
}
