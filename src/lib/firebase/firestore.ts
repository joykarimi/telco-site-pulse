import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { AssetType } from "@/lib/asset-types";
import { UserRole, ROLE_PERMISSIONS } from "@/lib/roles";

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

export async function getAsset(assetId: string): Promise<Asset | null> {
    const docRef = doc(db, "assets", assetId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            purchaseDate: data.purchaseDate?.toDate(),
            installationDate: data.installationDate?.toDate(),
        } as Asset;
    } else {
        return null;
    }
}

export async function addAsset(assetData: Omit<Asset, 'id'> & { site?: string }): Promise<void> {
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
    approver1?: string;
    approver2?: string;
    dateOfRequest?: Date;
    dateOfApproval?: Date;
}

export async function getAssetMovements(): Promise<AssetMovement[]> {
    const querySnapshot = await getDocs(collection(db, "asset_movements"));
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            approver1: data.approver1 || undefined,
            approver2: data.approver2 || undefined,
            dateOfRequest: data.dateOfRequest?.toDate(),
            dateOfApproval: data.dateOfApproval?.toDate(),
        } as AssetMovement;
    });
}

export async function getAssetMovement(movementId: string): Promise<AssetMovement | null> {
    const docRef = doc(db, "asset_movements", movementId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
            id: docSnap.id, 
            ...data,
            approver1: data.approver1 || undefined,
            approver2: data.approver2 || undefined,
            dateOfRequest: data.dateOfRequest?.toDate(),
            dateOfApproval: data.dateOfApproval?.toDate(),
        } as AssetMovement;
    } else {
        return null;
    }
}

export async function requestAssetMovement(movementData: Omit<AssetMovement, 'id' | 'status' | 'requestedBy' | 'dateOfApproval'> & { requestedBy: string, approver1: string, approver2?: string }): Promise<string> {
    const docRef = await addDoc(collection(db, "asset_movements"), { ...movementData, status: 'Pending', dateOfRequest: Timestamp.now() });
    return docRef.id;
}

export async function updateAssetMovementStatus(movementId: string, status: 'Approved' | 'Rejected'): Promise<void> {
    const movementRef = doc(db, "asset_movements", movementId);
    const updateData: { status: string, dateOfApproval?: Date } = { status };
    if (status === 'Approved') {
        updateData.dateOfApproval = new Date();
    }
    await updateDoc(movementRef, updateData);
}

export async function approveAssetMovement(movementId: string): Promise<void> {
    const movementRef = doc(db, "asset_movements", movementId);
    await updateDoc(movementRef, { status: 'Approved', dateOfApproval: new Date() });
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
            earningsSafaricom: parseFloat(row.Safaricom && String(row.Safaricom).trim() !== '' ? row.Safaricom : '0'),
            earningsAirtel: parseFloat(row.Airtel && String(row.Airtel).trim() !== '' ? row.Airtel : '0'),
            earningsJtl: parseFloat(row.JTL && String(row.JTL).trim() !== '' ? row.JTL : '0'),
            gridConsumption: parseFloat(row['Grid Expense'] && String(row['Grid Expense']).trim() !== '' ? row['Grid Expense'] : '0'),
            gridUnitCost: parseFloat(row['Grid Unit Cost'] && String(row['Grid Unit Cost']).trim() !== '' ? row['Grid Unit Cost'] : '0'), // Assuming Grid Unit Cost is in Excel
            fuelConsumption: parseFloat(row['Fuel Expense'] && String(row['Fuel Expense']).trim() !== '' ? row['Fuel Expense'] : '0'),
            fuelUnitCost: parseFloat(row['Fuel Unit Cost'] && String(row['Fuel Unit Cost']).trim() !== '' ? row['Fuel Unit Cost'] : '0'), // Assuming Fuel Unit Cost is in Excel
            solarMaintenanceCost: parseFloat(row['Solar Expense'] && String(row['Solar Expense']).trim() !== '' ? row['Solar Expense'] : '0'),
            solarContribution: String(row['Solar Contribution'] && String(row['Solar Contribution']).trim() !== '' ? row['Solar Contribution'] : '0') // Keep as string or parse as needed
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

// User Management Interfaces and Functions
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'maintenance_manager' | 'operations_manager' | 'user' | 'viewer'; // Added 'user' role
}

// Correctly fetches a user profile, ensuring displayName is constructed if not present.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const displayName = data.displayName || `${data.firstName} ${data.lastName}`.trim();
        return { uid: docSnap.id, ...data, displayName } as UserProfile;
    } else {
        return null;
    }
}

// Fetches all user profiles, ensuring displayName is present.
export async function getUserProfiles(): Promise<UserProfile[]> {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const displayName = data.displayName || `${data.firstName} ${data.lastName}`.trim();
        return { uid: doc.id, ...data, displayName } as UserProfile;
    });
}

// Fetches users by a specific role.
export async function getUserByRole(role: UserProfile['role']): Promise<UserProfile[]> {
    const q = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const displayName = data.displayName || `${data.firstName} ${data.lastName}`.trim();
        return { uid: doc.id, ...data, displayName } as UserProfile;
    });
}

export async function getUsersWithPermission(permission: string): Promise<UserProfile[]> {
    const rolesWithPermission: UserRole[] = [];
    for (const role in ROLE_PERMISSIONS) {
        if (ROLE_PERMISSIONS[role as UserRole].includes(permission)) {
            rolesWithPermission.push(role as UserRole);
        }
    }

    if (rolesWithPermission.length === 0) {
        return [];
    }

    const users: UserProfile[] = [];
    for (const role of rolesWithPermission) {
        const usersInRole = await getUserByRole(role);
        users.push(...usersInRole);
    }
    return users;
}


// Notification Interfaces and Functions
export type NotificationType = 'asset_movement_request' | 'asset_movement_approved' | 'asset_movement_rejected' | 'site_data_import_status';

export interface Notification {
  id: string;
  userId: string; // The ID of the auser who should receive the notification
  type: NotificationType;
  message: string;
  link?: string; // Optional link to the relevant page
  read: boolean;
  timestamp: Date;
  // Additional data specific to the notification type
  assetId?: string;
  fromSite?: string;
  toSite?: string;
  requestedByUserId?: string; // Add this new field
  importMonth?: number;
  importYear?: number;
  importSuccess?: boolean;
}

export async function addNotification(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'> & { read?: boolean }): Promise<void> {
    await addDoc(collection(db, "notifications"), {
        ...notificationData,
        read: notificationData.read ?? false,
        timestamp: new Date(),
    });
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
    } as Notification));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
}
