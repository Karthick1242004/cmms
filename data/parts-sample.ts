import type { Part } from "@/types/part"

export const sampleParts: Part[] = [
  {
    id: "part_001",
    name: "Hydraulic Filter HF-200",
    sku: "SKU-HF200",
    quantity: 15,
    location: "Warehouse A, Shelf 3B",
    department: "Maintenance",
    description: "Standard hydraulic filter for Model X equipment.",
    price: 25.99,
    minStockLevel: 5,
  },
  {
    id: "part_002",
    name: "O-Ring Kit ORK-50",
    sku: "SKU-ORK50",
    quantity: 50,
    location: "Maintenance Bay 1, Cabinet 2",
    department: "HVAC",
    description: "Assorted O-rings for various fittings.",
    price: 12.5,
    minStockLevel: 20,
  },
  {
    id: "part_003",
    name: "Drive Belt DB-1050",
    sku: "SKU-DB1050",
    quantity: 8,
    location: "Warehouse B, Bin 12",
    department: "IT",
    description: "Heavy-duty drive belt for conveyor systems.",
    price: 45.0,
    minStockLevel: 10,
  },
  {
    id: "part_004",
    name: "Spark Plug SP-X4",
    sku: "SKU-SPX4",
    quantity: 100,
    location: "Service Van 3",
    department: "Maintenance",
    description: "Standard spark plug for small engines.",
    price: 3.75,
    minStockLevel: 25,
  },
  {
    id: "part_005",
    name: "Lubricant LG-5L",
    sku: "SKU-LG5L",
    quantity: 3,
    location: "Warehouse A, Flammables Cabinet",
    department: "HVAC",
    description: "High-performance lubricant, 5 liter container.",
    price: 75.0,
    minStockLevel: 2,
  },
]
