
export const assetTypes = [
  "Generator",
  "Battery",
  "Solar Panel",
  "Rectifier",
  "ATS",
  "Other",
] as const;

export type AssetType = typeof assetTypes[number];

export const AssetStatus = [
  "Active",
  "Inactive",
] as const;

export type AssetStatus = typeof AssetStatus[number];
