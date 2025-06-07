import type { AssetDetail } from "@/types/asset"

export const sampleAssetDetails: AssetDetail[] = [
  // Equipment Example (similar to the image)
  {
    id: "A6381949",
    imageSrc: "/placeholder.svg?height=150&width=250",
    assetName: "The Cat® 416F2 Backhoe Loader",
    serialNo: "A6381949",
    rfid: "4036BA6629E8716D0BB81079",
    parentAsset: "-",
    productName: "PC00010 - Backhoe Loader",
    categoryName: "Equipment > Heavy Machinery",
    statusText: "Online",
    statusColor: "green",
    assetClass: "Operating Assets",
    constructionYear: 2022,
    warrantyStart: "07-Sep-2022",
    manufacturer: "Caterpillar Inc.",
    outOfOrder: "No",
    isActive: "Yes",
    category: "Equipment", // Main category for filtering
    size: "Large",
    costPrice: 75000.0,
    productionHoursDaily: 0.0, // As per image
    serviceStatus: "Operational",
    description: "Heavy-duty backhoe loader for construction and excavation tasks.",
    lastEnquiryDate: "15-May-2025",
    assetType: "Tangible",
    commissioningDate: "07-Sep-2022",
    endOfWarranty: "07-Sep-2023",
    expectedLifeSpan: 10, // More realistic lifespan
    deleted: "No",
    allocated: "Tracy Desmond (kate09mark@gmail.com)",
    allocatedOn: "10-Sep-2022",
    uom: "Each",
    salesPrice: 0.0, // As per image
    lastEnquiryBy: "John Smith",
    shelfLifeInMonth: 0, // As per image
    location: "Main Yard", // Added for list view
    purchaseDate: "01-Sep-2022", // Added for list view
    purchasePrice: 75000, // Added for list view
    condition: "good", // Added for list view
  },
  // Facility Example
  {
    id: "BLDGAHVAC01",
    imageSrc: "/placeholder.svg?height=150&width=250",
    assetName: "Building A - Central HVAC Unit",
    serialNo: "HVAC-SN-00123",
    rfid: "FAC001HVACRFID",
    parentAsset: "Building A",
    productName: "Trane XL20i",
    categoryName: "Facilities > HVAC Systems",
    statusText: "Operational",
    statusColor: "green",
    assetClass: "Building Systems",
    constructionYear: 2018,
    warrantyStart: "15-Jun-2018",
    manufacturer: "Trane Technologies",
    outOfOrder: "No",
    isActive: "Yes",
    category: "Facilities", // Main category for filtering
    costPrice: 25000.0,
    description: "Central HVAC unit for Building A, providing heating and cooling.",
    assetType: "Fixed Asset",
    commissioningDate: "01-Jul-2018",
    endOfWarranty: "01-Jul-2028",
    expectedLifeSpan: 20,
    deleted: "No",
    allocated: "Maintenance Department",
    uom: "System",
    location: "Building A - Rooftop", // Added for list view
    purchaseDate: "01-Jun-2018", // Added for list view
    purchasePrice: 25000, // Added for list view
    condition: "excellent", // Added for list view
  },
  // Product Example
  {
    id: "PRODCHEM005",
    imageSrc: "/placeholder.svg?height=150&width=250",
    assetName: "Industrial Cleaning Solvent - 55 Gallon Drum",
    serialNo: "CHEM-DRUM-BATCH-005", // Batch number as serial
    categoryName: "Products > Chemicals",
    statusText: "In Stock",
    statusColor: "green",
    assetClass: "Inventory",
    manufacturer: "ChemSolutions Inc.",
    isActive: "Yes",
    category: "Products", // Main category for filtering
    costPrice: 350.0,
    description: "High-strength industrial cleaning solvent for degreasing machinery.",
    assetType: "Consumable",
    commissioningDate: "N/A", // Products might not have this
    expectedLifeSpan: 2, // Shelf life as lifespan
    deleted: "No",
    uom: "Drum",
    salesPrice: 499.99,
    shelfLifeInMonth: 24,
    location: "Warehouse B - Chemical Storage", // Added for list view
    purchaseDate: "10-Mar-2025", // Added for list view
    purchasePrice: 350, // Added for list view
    condition: "new", // Added for list view
  },
  // Tools Example
  {
    id: "TOOLWRENCHSET01",
    imageSrc: "/placeholder.svg?height=150&width=250",
    assetName: "Heavy Duty Wrench Set (Metric)",
    serialNo: "HDWS-M-001",
    categoryName: "Tools > Hand Tools",
    statusText: "Available",
    statusColor: "green",
    assetClass: "Portable Tools",
    manufacturer: "Craftsman",
    isActive: "Yes",
    category: "Tools", // Main category for filtering
    costPrice: 120.0,
    description: "Complete set of metric heavy-duty wrenches for various tasks.",
    assetType: "Reusable",
    commissioningDate: "01-Jan-2023",
    expectedLifeSpan: 5,
    deleted: "No",
    allocated: "Tool Crib A",
    uom: "Set",
    location: "Tool Crib A", // Added for list view
    purchaseDate: "15-Dec-2022", // Added for list view
    purchasePrice: 120, // Added for list view
    condition: "good", // Added for list view
  },
  // Another Equipment Example
  {
    id: "EQPFORKLIFT03",
    imageSrc: "/placeholder.svg?height=150&width=250",
    assetName: "Electric Forklift - 3 Ton",
    serialNo: "EFKL-003-SN789",
    rfid: "EQP003FLRFID",
    parentAsset: "Warehouse Fleet",
    productName: "Toyota 8FBE15U",
    categoryName: "Equipment > Material Handling",
    statusText: "Maintenance",
    statusColor: "yellow",
    assetClass: "Operating Assets",
    constructionYear: 2020,
    warrantyStart: "10-Mar-2020",
    manufacturer: "Toyota Material Handling",
    outOfOrder: "No", // It's in maintenance, not necessarily out of order
    isActive: "Yes",
    category: "Equipment", // Main category for filtering
    costPrice: 32000.0,
    description: "Electric forklift for warehouse operations, 3-ton capacity.",
    assetType: "Tangible",
    commissioningDate: "01-Apr-2020",
    endOfWarranty: "01-Apr-2023",
    expectedLifeSpan: 12,
    deleted: "No",
    allocated: "Warehouse B Operations",
    uom: "Each",
    location: "Warehouse B - Charging Station", // Added for list view
    purchaseDate: "01-Mar-2020", // Added for list view
    purchasePrice: 32000, // Added for list view
    condition: "fair", // Added for list view
  },
]
