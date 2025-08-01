import type { Part } from "@/types/part"
import type { StockTransaction } from "@/types/stock-transaction"

export const sampleParts: Part[] = [
  {
    id: "part_001",
    partNumber: "HF-200-01",
    name: "Hydraulic Filter HF-200",
    sku: "SKU-HF200",
    materialCode: "MAT-HYD-FLT",
    description: "Standard hydraulic filter for Model X equipment.",
    category: "Filters",
    department: "Maintenance",
    linkedAssets: ["asset_001", "asset_003"],
    quantity: 15,
    minStockLevel: 5,
    unitPrice: 25.99,
    supplier: "Hydraulic Solutions Inc",
    location: "Warehouse A, Shelf 3B",
  },
  {
    id: "part_002",
    partNumber: "ORK-50-01",
    name: "O-Ring Kit ORK-50",
    sku: "SKU-ORK50",
    materialCode: "MAT-SEAL-ORG",
    description: "Assorted O-rings for various fittings.",
    category: "Seals & Gaskets",
    department: "HVAC",
    linkedAssets: ["asset_002", "asset_004"],
    quantity: 50,
    minStockLevel: 20,
    unitPrice: 12.50,
    supplier: "Seal Tech Corp",
    location: "Maintenance Bay 1, Cabinet 2",
  },
  {
    id: "part_003",
    partNumber: "DB-1050-01",
    name: "Drive Belt DB-1050",
    sku: "SKU-DB1050",
    materialCode: "MAT-BLT-DRV",
    description: "Heavy-duty drive belt for conveyor systems.",
    category: "Belts & Chains",
    department: "Operations",
    linkedAssets: ["asset_005", "asset_006"],
    quantity: 8,
    minStockLevel: 10,
    unitPrice: 45.00,
    supplier: "Industrial Belts Ltd",
    location: "Warehouse B, Bin 12",
  },
  {
    id: "part_004",
    partNumber: "SP-X4-01",
    name: "Spark Plug SP-X4",
    sku: "SKU-SPX4",
    materialCode: "MAT-IGN-PLG",
    description: "Standard spark plug for small engines.",
    category: "Electrical",
    department: "Maintenance",
    linkedAssets: ["asset_007", "asset_008"],
    quantity: 100,
    minStockLevel: 25,
    unitPrice: 3.75,
    supplier: "Auto Parts Express",
    location: "Service Van 3",
  },
  {
    id: "part_005",
    partNumber: "LG-5L-01",
    name: "Lubricant LG-5L",
    sku: "SKU-LG5L",
    materialCode: "MAT-LUB-GEN",
    description: "High-performance lubricant, 5 liter container.",
    category: "Lubricants",
    department: "HVAC",
    linkedAssets: ["asset_009", "asset_010"],
    quantity: 3,
    minStockLevel: 2,
    unitPrice: 75.00,
    supplier: "Lubrication Systems Co",
    location: "Warehouse A, Flammables Cabinet",
  },
  {
    id: "part_006",
    partNumber: "BRG-6205-01",
    name: "Ball Bearing 6205-2RS",
    sku: "SKU-BRG6205",
    materialCode: "MAT-BRG-BAL",
    description: "Deep groove ball bearing with rubber seals.",
    category: "Bearings",
    department: "Maintenance",
    linkedAssets: ["asset_011", "asset_012"],
    quantity: 12,
    minStockLevel: 8,
    unitPrice: 18.25,
    supplier: "Bearing Solutions Inc",
    location: "Maintenance Workshop, Drawer 3",
  },
  {
    id: "part_007",
    partNumber: "VAL-BT-25-01",
    name: "Ball Valve 1 inch",
    sku: "SKU-VALBT25",
    materialCode: "MAT-VAL-BAL",
    description: "Brass ball valve, 1 inch NPT threading.",
    category: "Valves",
    department: "Plumbing",
    linkedAssets: ["asset_013", "asset_014"],
    quantity: 6,
    minStockLevel: 4,
    unitPrice: 32.50,
    supplier: "Valve & Fitting Co",
    location: "Plumbing Shop, Rack 2",
  },
  {
    id: "part_008",
    partNumber: "SW-16AWG-01",
    name: "Electrical Wire 16AWG",
    sku: "SKU-SW16AWG",
    materialCode: "MAT-WIR-ELC",
    description: "Stranded copper wire, 16 AWG, 100ft roll.",
    category: "Electrical",
    department: "Electrical",
    linkedAssets: ["asset_015", "asset_016"],
    quantity: 25,
    minStockLevel: 10,
    unitPrice: 28.75,
    supplier: "Electric Supply House",
    location: "Electrical Shop, Wire Rack",
  },
]

export const sampleStockTransactions: StockTransaction[] = [
  {
    id: "txn_001",
    date: "2024-01-15",
    time: "10:30:00",
    partId: "part_001",
    partNumber: "HF-200-01",
    partName: "Hydraulic Filter HF-200",
    sku: "SKU-HF200",
    materialCode: "MAT-HYD-FLT",
    category: "Filters",
    department: "Maintenance",
    location: "Warehouse A, Shelf 3B",
    transactionType: "in",
    quantity: 20,
    unitPrice: 25.99,
    totalValue: 519.80,
    reason: "Purchase Order PO-2024-001",
    performedBy: "John Smith",
    balanceAfter: 35,
    supplier: "Hydraulic Solutions Inc",
    referenceNumber: "PO-2024-001",
    notes: "Regular stock replenishment",
  },
  {
    id: "txn_002",
    date: "2024-01-16",
    time: "14:15:00",
    partId: "part_001",
    partNumber: "HF-200-01",
    partName: "Hydraulic Filter HF-200",
    sku: "SKU-HF200",
    materialCode: "MAT-HYD-FLT",
    category: "Filters",
    department: "Maintenance",
    location: "Warehouse A, Shelf 3B",
    transactionType: "out",
    quantity: -2,
    unitPrice: 25.99,
    totalValue: -51.98,
    reason: "Maintenance Work Order WO-2024-045",
    performedBy: "Mike Johnson",
    balanceAfter: 33,
    assetId: "asset_001",
    referenceNumber: "WO-2024-045",
    notes: "Replaced filters in hydraulic system",
  },
  {
    id: "txn_003",
    date: "2024-01-18",
    time: "09:45:00",
    partId: "part_002",
    partNumber: "ORK-50-01",
    partName: "O-Ring Kit ORK-50",
    sku: "SKU-ORK50",
    materialCode: "MAT-SEAL-ORG",
    category: "Seals & Gaskets",
    department: "HVAC",
    location: "Maintenance Bay 1, Cabinet 2",
    transactionType: "in",
    quantity: 25,
    unitPrice: 12.50,
    totalValue: 312.50,
    reason: "Emergency Purchase",
    performedBy: "Sarah Wilson",
    balanceAfter: 75,
    supplier: "Seal Tech Corp",
    referenceNumber: "EPO-2024-003",
    notes: "Rush order due to multiple system failures",
  },
  {
    id: "txn_004",
    date: "2024-01-20",
    time: "11:20:00",
    partId: "part_003",
    partNumber: "DB-1050-01",
    partName: "Drive Belt DB-1050",
    sku: "SKU-DB1050",
    materialCode: "MAT-BLT-DRV",
    category: "Belts & Chains",
    department: "Operations",
    location: "Warehouse B, Bin 12",
    transactionType: "out",
    quantity: -1,
    unitPrice: 45.00,
    totalValue: -45.00,
    reason: "Preventive Maintenance PM-2024-012",
    performedBy: "Robert Brown",
    balanceAfter: 7,
    assetId: "asset_005",
    referenceNumber: "PM-2024-012",
    notes: "Scheduled belt replacement",
  },
  {
    id: "txn_005",
    date: "2024-01-22",
    time: "15:30:00",
    partId: "part_004",
    partNumber: "SP-X4-01",
    partName: "Spark Plug SP-X4",
    sku: "SKU-SPX4",
    materialCode: "MAT-IGN-PLG",
    category: "Electrical",
    department: "Maintenance",
    location: "Service Van 3",
    transactionType: "adjustment",
    quantity: -5,
    unitPrice: 3.75,
    totalValue: -18.75,
    reason: "Inventory Count Adjustment",
    performedBy: "Lisa Garcia",
    balanceAfter: 95,
    notes: "Found 5 damaged units during inventory count",
  },
  {
    id: "txn_006",
    date: "2024-01-25",
    time: "08:15:00",
    partId: "part_005",
    partNumber: "LG-5L-01",
    partName: "Lubricant LG-5L",
    sku: "SKU-LG5L",
    materialCode: "MAT-LUB-GEN",
    category: "Lubricants",
    department: "HVAC",
    location: "Warehouse A, Flammables Cabinet",
    transactionType: "out",
    quantity: -1,
    unitPrice: 75.00,
    totalValue: -75.00,
    reason: "HVAC System Maintenance",
    performedBy: "David Lee",
    balanceAfter: 2,
    assetId: "asset_009",
    referenceNumber: "WO-2024-078",
    notes: "Annual lubrication service",
  },
  {
    id: "txn_007",
    date: "2024-01-28",
    time: "13:45:00",
    partId: "part_006",
    partNumber: "BRG-6205-01",
    partName: "Ball Bearing 6205-2RS",
    sku: "SKU-BRG6205",
    materialCode: "MAT-BRG-BAL",
    category: "Bearings",
    department: "Maintenance",
    location: "Maintenance Workshop, Drawer 3",
    transactionType: "transfer",
    quantity: -2,
    unitPrice: 18.25,
    totalValue: -36.50,
    reason: "Transfer to Field Service Van",
    performedBy: "Tom Anderson",
    balanceAfter: 10,
    notes: "Moved to van for upcoming field repairs",
  },
]
