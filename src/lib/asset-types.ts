
export const assetTypes = [
    "Generator",
    "Rectifier",
    "Solar Panel",
    "Battery Bank",
    "Smart Controller",
    "Fuel Sensor",
    "Door Sensor",
] as const;

export type AssetType = typeof assetTypes[number];
