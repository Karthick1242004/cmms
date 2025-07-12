// import type { AssetDetail } from "@/types/asset"

// export const sampleAssetDetails: AssetDetail[] = [
//   // Equipment Example - Maintenance Department
//   {
//     id: "A6381949",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "The Cat® 416F2 Backhoe Loader",
//     serialNo: "A6381949",
//     rfid: "4036BA6629E8716D0BB81079",
//     parentAsset: "-",
//     productName: "PC00010 - Backhoe Loader",
//     categoryName: "Equipment > Heavy Machinery",
//     statusText: "Online",
//     statusColor: "green",
//     assetClass: "Operating Assets",
//     constructionYear: 2022,
//     warrantyStart: "07-Sep-2022",
//     manufacturer: "Caterpillar Inc.",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Equipment", // Main category for filtering
//     department: "Maintenance", // Department that owns this asset
//     size: "Large",
//     costPrice: 75000.0,
//     productionHoursDaily: 0.0, // As per image
//     serviceStatus: "Operational",
//     description: "Heavy-duty backhoe loader for construction and excavation tasks.",
//     lastEnquiryDate: "15-May-2025",
//     productionTime: "8 hours/day",
//     lineNumber: "Production Line A",
//     assetType: "Tangible",
//     commissioningDate: "07-Sep-2022",
//     endOfWarranty: "07-Sep-2023",
//     expectedLifeSpan: 10, // More realistic lifespan
//     deleted: "No",
//     allocated: "Tracy Desmond (kate09mark@gmail.com)",
//     allocatedOn: "10-Sep-2022",
//     uom: "Each",
//     salesPrice: 0.0, // As per image
//     lastEnquiryBy: "John Smith",
//     shelfLifeInMonth: 0, // As per image
//     location: "Main Yard", // Added for list view
//     purchaseDate: "01-Sep-2022", // Added for list view
//     purchasePrice: 75000, // Added for list view
//     condition: "good", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Hydraulic Fluid",
//         partNumber: "HF-CAT-001",
//         quantity: 50,
//         unitCost: 25.50,
//         supplier: "Caterpillar Parts",
//         lastReplaced: "15-Mar-2025"
//       },
//       {
//         id: "BOM002",
//         partName: "Air Filter",
//         partNumber: "AF-CAT-416F2",
//         quantity: 2,
//         unitCost: 45.00,
//         supplier: "Caterpillar Parts",
//         lastReplaced: "10-Jan-2025"
//       },
//       {
//         id: "BOM003",
//         partName: "Engine Oil",
//         partNumber: "EO-15W40",
//         quantity: 20,
//         unitCost: 12.75,
//         supplier: "Mobil 1",
//         lastReplaced: "01-Feb-2025"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Hours Meter Reading",
//         reading: 1247.5,
//         unit: "hours",
//         recordedDate: "20-May-2025",
//         recordedBy: "John Smith"
//       },
//       {
//         id: "ME002",
//         eventType: "Fuel Consumption",
//         reading: 850.2,
//         unit: "gallons",
//         recordedDate: "18-May-2025",
//         recordedBy: "Mike Wilson"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Tracy Desmond",
//         role: "Primary Operator",
//         email: "kate09mark@gmail.com",
//         phone: "+1-555-0123",
//         assignedDate: "10-Sep-2022"
//       },
//       {
//         id: "PER002",
//         name: "John Smith",
//         role: "Maintenance Technician",
//         email: "john.smith@company.com",
//         phone: "+1-555-0456",
//         assignedDate: "01-Sep-2022"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Caterpillar Inc.",
//       type: "Full Coverage",
//       startDate: "07-Sep-2022",
//       endDate: "07-Sep-2023",
//       coverage: "Parts and Labor",
//       terms: "Standard manufacturer warranty covering defects in materials and workmanship",
//       contactInfo: "1-800-CATERPILLAR",
//       claimHistory: []
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "Main Construction Division",
//         type: "Operating Unit",
//         contactPerson: "Sarah Johnson",
//         phone: "+1-555-0789"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Operation Manual",
//         type: "PDF",
//         size: "2.5 MB",
//         uploadDate: "07-Sep-2022",
//         uploadedBy: "Admin User"
//       },
//       {
//         id: "FILE002",
//         name: "Maintenance Schedule",
//         type: "PDF",
//         size: "1.2 MB",
//         uploadDate: "15-Sep-2022",
//         uploadedBy: "John Smith"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 92000.0,
//       annualOperatingCost: 12000.0,
//       depreciationRate: 0.10,
//       currentBookValue: 67500.0,
//       maintenanceCostYTD: 5200.0,
//       fuelCostYTD: 8400.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2022-001",
//       vendor: "Caterpillar Dealer Network",
//       purchaseDate: "01-Sep-2022",
//       deliveryDate: "05-Sep-2022",
//       terms: "Net 30",
//       discount: 0.05,
//       totalCost: 75000.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Internal Operations",
//       type: "Internal",
//       contactPerson: "Operations Manager",
//       phone: "+1-555-0999"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Routine Inspection",
//         performedBy: "John Smith",
//         notes: "All systems operating normally"
//       },
//       {
//         id: "LOG002",
//         date: "15-Mar-2025",
//         action: "Hydraulic Fluid Change",
//         performedBy: "Mike Wilson",
//         notes: "Replaced 50 gallons of hydraulic fluid"
//       }
//     ]
//   },
//   // Equipment Example - IT Department
//   {
//     id: "IT001949",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Dell PowerEdge R740 Server",
//     serialNo: "IT001949",
//     rfid: "4036IT6629E8716D0BB81079",
//     parentAsset: "Server Rack A",
//     productName: "R740-001 - PowerEdge Server",
//     categoryName: "Equipment > IT Hardware",
//     statusText: "Online",
//     statusColor: "green",
//     assetClass: "Operating Assets",
//     constructionYear: 2023,
//     warrantyStart: "15-Jan-2023",
//     manufacturer: "Dell Technologies",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Equipment", // Main category for filtering
//     department: "IT", // Department that owns this asset
//     size: "Standard",
//     costPrice: 8500.0,
//     productionHoursDaily: 24.0, // Always running
//     serviceStatus: "Operational",
//     description: "High-performance server for enterprise applications and databases.",
//     lastEnquiryDate: "20-May-2025",
//     productionTime: "24/7 Operation",
//     lineNumber: "Data Center Rack A",
//     assetType: "Tangible",
//     commissioningDate: "15-Jan-2023",
//     endOfWarranty: "15-Jan-2026",
//     expectedLifeSpan: 5, // IT equipment shorter lifespan
//     deleted: "No",
//     allocated: "IT Operations Team",
//     allocatedOn: "20-Jan-2023",
//     uom: "Each",
//     salesPrice: 0.0,
//     lastEnquiryBy: "Sarah Johnson",
//     shelfLifeInMonth: 0,
//     location: "Data Center - Rack A", // Added for list view
//     purchaseDate: "10-Jan-2023", // Added for list view
//     purchasePrice: 8500, // Added for list view
//     condition: "excellent", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Memory Module 32GB",
//         partNumber: "MEM-32GB-DDR4",
//         quantity: 8,
//         unitCost: 250.00,
//         supplier: "Dell Technologies",
//         lastReplaced: "N/A"
//       },
//       {
//         id: "BOM002",
//         partName: "SSD Drive 1TB",
//         partNumber: "SSD-1TB-NVME",
//         quantity: 4,
//         unitCost: 180.00,
//         supplier: "Dell Technologies",
//         lastReplaced: "N/A"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "CPU Usage",
//         reading: 45.2,
//         unit: "percent",
//         recordedDate: "20-May-2025",
//         recordedBy: "Monitoring System"
//       },
//       {
//         id: "ME002",
//         eventType: "Memory Usage",
//         reading: 78.5,
//         unit: "percent",
//         recordedDate: "20-May-2025",
//         recordedBy: "Monitoring System"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Sarah Johnson",
//         role: "System Administrator",
//         email: "sarah.johnson@company.com",
//         phone: "+1-555-0234",
//         assignedDate: "20-Jan-2023"
//       },
//       {
//         id: "PER002",
//         name: "David Chen",
//         role: "Network Engineer",
//         email: "david.chen@company.com",
//         phone: "+1-555-0567",
//         assignedDate: "25-Jan-2023"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Dell Technologies",
//       type: "ProSupport Plus",
//       startDate: "15-Jan-2023",
//       endDate: "15-Jan-2026",
//       coverage: "24/7 Support and Parts",
//       terms: "Next business day on-site service",
//       contactInfo: "1-800-DELL-SUPPORT",
//       claimHistory: []
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "IT Operations Division",
//         type: "Support Unit",
//         contactPerson: "IT Manager",
//         phone: "+1-555-0890"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Server Configuration Guide",
//         type: "PDF",
//         size: "1.8 MB",
//         uploadDate: "15-Jan-2023",
//         uploadedBy: "Sarah Johnson"
//       },
//       {
//         id: "FILE002",
//         name: "Network Diagram",
//         type: "PDF",
//         size: "0.9 MB",
//         uploadDate: "20-Jan-2023",
//         uploadedBy: "David Chen"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 12000.0,
//       annualOperatingCost: 2400.0,
//       depreciationRate: 0.20,
//       currentBookValue: 6800.0,
//       maintenanceCostYTD: 450.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2023-IT-001",
//       vendor: "Dell Technologies",
//       purchaseDate: "10-Jan-2023",
//       deliveryDate: "12-Jan-2023",
//       terms: "Net 30",
//       discount: 0.10,
//       totalCost: 8500.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Internal IT Services",
//       type: "Internal",
//       contactPerson: "CTO",
//       phone: "+1-555-0111"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "System Health Check",
//         performedBy: "Sarah Johnson",
//         notes: "All systems running optimally"
//       },
//       {
//         id: "LOG002",
//         date: "15-Apr-2025",
//         action: "Security Update",
//         performedBy: "David Chen",
//         notes: "Applied latest security patches"
//       }
//     ]
//   },
//   // Equipment Example - HVAC Department
//   {
//     id: "HV001949",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Carrier 30GX Chiller Unit",
//     serialNo: "HV001949",
//     rfid: "4036HV6629E8716D0BB81079",
//     parentAsset: "Building B HVAC System",
//     productName: "30GX-150 - Centrifugal Chiller",
//     categoryName: "Equipment > HVAC Systems",
//     statusText: "Maintenance",
//     statusColor: "yellow",
//     assetClass: "Operating Assets",
//     constructionYear: 2021,
//     warrantyStart: "10-Jun-2021",
//     manufacturer: "Carrier Corporation",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Equipment", // Main category for filtering
//     department: "HVAC", // Department that owns this asset
//     size: "Large",
//     costPrice: 45000.0,
//     productionHoursDaily: 12.0, // Seasonal operation
//     serviceStatus: "Scheduled Maintenance",
//     description: "Industrial chiller unit for building cooling system.",
//     lastEnquiryDate: "18-May-2025",
//     productionTime: "12 hours/day seasonal",
//     lineNumber: "Building B HVAC Line",
//     assetType: "Tangible",
//     commissioningDate: "10-Jun-2021",
//     endOfWarranty: "10-Jun-2024",
//     expectedLifeSpan: 15, // HVAC equipment longer lifespan
//     deleted: "No",
//     allocated: "HVAC Maintenance Team",
//     allocatedOn: "15-Jun-2021",
//     uom: "Each",
//     salesPrice: 0.0,
//     lastEnquiryBy: "Mike Wilson",
//     shelfLifeInMonth: 0,
//     location: "Building B - Mechanical Room", // Added for list view
//     purchaseDate: "01-Jun-2021", // Added for list view
//     purchasePrice: 45000, // Added for list view
//     condition: "good", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Refrigerant R-134a",
//         partNumber: "REF-R134A-100",
//         quantity: 100,
//         unitCost: 8.50,
//         supplier: "Carrier Corporation",
//         lastReplaced: "10-Jan-2025"
//       },
//       {
//         id: "BOM002",
//         partName: "Compressor Belt",
//         partNumber: "CB-30GX-001",
//         quantity: 2,
//         unitCost: 125.00,
//         supplier: "Carrier Corporation",
//         lastReplaced: "15-Dec-2024"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Operating Hours",
//         reading: 5420.0,
//         unit: "hours",
//         recordedDate: "20-May-2025",
//         recordedBy: "Mike Wilson"
//       },
//       {
//         id: "ME002",
//         eventType: "Energy Consumption",
//         reading: 12450.0,
//         unit: "kWh",
//         recordedDate: "20-May-2025",
//         recordedBy: "Energy Monitor"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Mike Wilson",
//         role: "HVAC Technician",
//         email: "mike.wilson@company.com",
//         phone: "+1-555-0345",
//         assignedDate: "15-Jun-2021"
//       },
//       {
//         id: "PER002",
//         name: "Lisa Rodriguez",
//         role: "HVAC Supervisor",
//         email: "lisa.rodriguez@company.com",
//         phone: "+1-555-0678",
//         assignedDate: "10-Jun-2021"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Carrier Corporation",
//       type: "Extended Warranty",
//       startDate: "10-Jun-2021",
//       endDate: "10-Jun-2024",
//       coverage: "Parts and Labor",
//       terms: "Annual maintenance required",
//       contactInfo: "1-800-CARRIER",
//       claimHistory: [
//         {
//           claimNumber: "CL-2024-001",
//           date: "15-Mar-2024",
//           issue: "Compressor repair",
//           status: "Closed",
//           cost: 0.0
//         }
//       ]
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "Facilities Management",
//         type: "Support Unit",
//         contactPerson: "Facilities Manager",
//         phone: "+1-555-0901"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Installation Manual",
//         type: "PDF",
//         size: "5.2 MB",
//         uploadDate: "10-Jun-2021",
//         uploadedBy: "Mike Wilson"
//       },
//       {
//         id: "FILE002",
//         name: "Maintenance Schedule",
//         type: "PDF",
//         size: "1.5 MB",
//         uploadDate: "15-Jun-2021",
//         uploadedBy: "Lisa Rodriguez"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 58000.0,
//       annualOperatingCost: 8500.0,
//       depreciationRate: 0.08,
//       currentBookValue: 36000.0,
//       maintenanceCostYTD: 3200.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2021-HVAC-001",
//       vendor: "Carrier Corporation",
//       purchaseDate: "01-Jun-2021",
//       deliveryDate: "05-Jun-2021",
//       terms: "Net 30",
//       discount: 0.08,
//       totalCost: 45000.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Building B Tenants",
//       type: "Internal",
//       contactPerson: "Building Manager",
//       phone: "+1-555-0222"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Scheduled Maintenance",
//         performedBy: "Mike Wilson",
//         notes: "Routine maintenance in progress"
//       },
//       {
//         id: "LOG002",
//         date: "15-Mar-2024",
//         action: "Compressor Repair",
//         performedBy: "Lisa Rodriguez",
//         notes: "Compressor issue resolved under warranty"
//       }
//     ]
//   },
//   // Facility Example - Maintenance Department
//   {
//     id: "BLDGAHVAC01",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Building A - Central HVAC Unit",
//     serialNo: "HVAC-SN-00123",
//     rfid: "FAC001HVACRFID",
//     parentAsset: "Building A",
//     productName: "Trane XL20i",
//     categoryName: "Facilities > HVAC Systems",
//     statusText: "Operational",
//     statusColor: "green",
//     assetClass: "Building Systems",
//     constructionYear: 2018,
//     warrantyStart: "15-Jun-2018",
//     manufacturer: "Trane Technologies",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Facilities", // Main category for filtering
//     department: "Maintenance", // Department responsible for this facility
//     size: "Large",
//     costPrice: 25000.0,
//     productionHoursDaily: 16.0,
//     serviceStatus: "Operational",
//     description: "Central HVAC unit for Building A, providing heating and cooling.",
//     lastEnquiryDate: "19-May-2025",
//     productionTime: "16 hours/day",
//     lineNumber: "Building A Climate Control",
//     assetType: "Fixed Asset",
//     commissioningDate: "01-Jul-2018",
//     endOfWarranty: "01-Jul-2028",
//     expectedLifeSpan: 20,
//     deleted: "No",
//     allocated: "Maintenance Department",
//     allocatedOn: "01-Jul-2018",
//     uom: "System",
//     salesPrice: 0.0,
//     lastEnquiryBy: "Building Manager",
//     shelfLifeInMonth: 0,
//     location: "Building A - Rooftop", // Added for list view
//     purchaseDate: "01-Jun-2018", // Added for list view
//     purchasePrice: 25000, // Added for list view
//     condition: "excellent", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Air Filter",
//         partNumber: "AF-XL20i-001",
//         quantity: 6,
//         unitCost: 35.00,
//         supplier: "Trane Technologies",
//         lastReplaced: "01-Apr-2025"
//       },
//       {
//         id: "BOM002",
//         partName: "Thermostat",
//         partNumber: "TH-XL20i-SMART",
//         quantity: 1,
//         unitCost: 285.00,
//         supplier: "Trane Technologies",
//         lastReplaced: "N/A"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Operating Hours",
//         reading: 18540.0,
//         unit: "hours",
//         recordedDate: "20-May-2025",
//         recordedBy: "Building Manager"
//       },
//       {
//         id: "ME002",
//         eventType: "Energy Consumption",
//         reading: 45200.0,
//         unit: "kWh",
//         recordedDate: "20-May-2025",
//         recordedBy: "Energy Monitor"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Building Manager",
//         role: "Facility Manager",
//         email: "building.manager@company.com",
//         phone: "+1-555-0456",
//         assignedDate: "01-Jul-2018"
//       },
//       {
//         id: "PER002",
//         name: "Tom Anderson",
//         role: "HVAC Technician",
//         email: "tom.anderson@company.com",
//         phone: "+1-555-0789",
//         assignedDate: "15-Jul-2018"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Trane Technologies",
//       type: "10-Year Extended Warranty",
//       startDate: "01-Jul-2018",
//       endDate: "01-Jul-2028",
//       coverage: "Parts and Labor",
//       terms: "Annual maintenance required",
//       contactInfo: "1-800-TRANE",
//       claimHistory: []
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "Building A Operations",
//         type: "Facility Unit",
//         contactPerson: "Building Manager",
//         phone: "+1-555-0456"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "System Manual",
//         type: "PDF",
//         size: "3.8 MB",
//         uploadDate: "01-Jul-2018",
//         uploadedBy: "Building Manager"
//       },
//       {
//         id: "FILE002",
//         name: "Maintenance Log",
//         type: "XLSX",
//         size: "2.1 MB",
//         uploadDate: "01-Apr-2025",
//         uploadedBy: "Tom Anderson"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 32000.0,
//       annualOperatingCost: 3200.0,
//       depreciationRate: 0.05,
//       currentBookValue: 16500.0,
//       maintenanceCostYTD: 1800.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2018-FAC-001",
//       vendor: "Trane Technologies",
//       purchaseDate: "01-Jun-2018",
//       deliveryDate: "25-Jun-2018",
//       terms: "Net 30",
//       discount: 0.12,
//       totalCost: 25000.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Building A Occupants",
//       type: "Internal",
//       contactPerson: "Building Manager",
//       phone: "+1-555-0456"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Performance Check",
//         performedBy: "Tom Anderson",
//         notes: "System operating efficiently"
//       },
//       {
//         id: "LOG002",
//         date: "01-Apr-2025",
//         action: "Filter Replacement",
//         performedBy: "Tom Anderson",
//         notes: "Replaced all 6 air filters"
//       }
//     ]
//   },
//   // Product Example - Maintenance Department
//   {
//     id: "PRODCHEM005",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Industrial Cleaning Solvent - 55 Gallon Drum",
//     serialNo: "CHEM-DRUM-BATCH-005", // Batch number as serial
//     rfid: "PROD005CHEMRFID",
//     parentAsset: "Chemical Inventory",
//     productName: "Heavy Duty Degreaser",
//     categoryName: "Products > Chemicals",
//     statusText: "In Stock",
//     statusColor: "green",
//     assetClass: "Inventory",
//     constructionYear: 2025,
//     warrantyStart: "10-Mar-2025",
//     manufacturer: "ChemSolutions Inc.",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Products", // Main category for filtering
//     department: "Maintenance", // Department that manages this product
//     size: "55 Gallon",
//     costPrice: 350.0,
//     productionHoursDaily: 0.0,
//     serviceStatus: "Available",
//     description: "High-strength industrial cleaning solvent for degreasing machinery.",
//     lastEnquiryDate: "18-May-2025",
//     productionTime: "N/A",
//     lineNumber: "Chemical Storage A",
//     assetType: "Consumable",
//     commissioningDate: "N/A", // Products might not have this
//     endOfWarranty: "10-Mar-2027",
//     expectedLifeSpan: 2, // Shelf life as lifespan
//     deleted: "No",
//     allocated: "Warehouse B",
//     allocatedOn: "15-Mar-2025",
//     uom: "Drum",
//     salesPrice: 499.99,
//     lastEnquiryBy: "Maintenance Supervisor",
//     shelfLifeInMonth: 24,
//     location: "Warehouse B - Chemical Storage", // Added for list view
//     purchaseDate: "10-Mar-2025", // Added for list view
//     purchasePrice: 350, // Added for list view
//     condition: "new", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Safety Data Sheet",
//         partNumber: "SDS-CHEM-005",
//         quantity: 1,
//         unitCost: 0.0,
//         supplier: "ChemSolutions Inc.",
//         lastReplaced: "N/A"
//       },
//       {
//         id: "BOM002",
//         partName: "Drum Seal",
//         partNumber: "DS-55GAL-001",
//         quantity: 1,
//         unitCost: 15.00,
//         supplier: "ChemSolutions Inc.",
//         lastReplaced: "N/A"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Inventory Level",
//         reading: 55.0,
//         unit: "gallons",
//         recordedDate: "20-May-2025",
//         recordedBy: "Warehouse Staff"
//       },
//       {
//         id: "ME002",
//         eventType: "Usage Rate",
//         reading: 0.0,
//         unit: "gallons/month",
//         recordedDate: "20-May-2025",
//         recordedBy: "Inventory System"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Warehouse Staff",
//         role: "Inventory Manager",
//         email: "warehouse@company.com",
//         phone: "+1-555-0567",
//         assignedDate: "15-Mar-2025"
//       },
//       {
//         id: "PER002",
//         name: "Safety Officer",
//         role: "Chemical Safety",
//         email: "safety@company.com",
//         phone: "+1-555-0890",
//         assignedDate: "15-Mar-2025"
//       }
//     ],
//     warrantyDetails: {
//       provider: "ChemSolutions Inc.",
//       type: "Quality Guarantee",
//       startDate: "10-Mar-2025",
//       endDate: "10-Mar-2027",
//       coverage: "Product Quality",
//       terms: "Full replacement if defective",
//       contactInfo: "1-800-CHEMSOL",
//       claimHistory: []
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "Maintenance Operations",
//         type: "Operating Unit",
//         contactPerson: "Maintenance Supervisor",
//         phone: "+1-555-0123"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Safety Data Sheet",
//         type: "PDF",
//         size: "0.8 MB",
//         uploadDate: "10-Mar-2025",
//         uploadedBy: "Safety Officer"
//       },
//       {
//         id: "FILE002",
//         name: "Material Certificate",
//         type: "PDF",
//         size: "0.5 MB",
//         uploadDate: "10-Mar-2025",
//         uploadedBy: "Warehouse Staff"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 350.0,
//       annualOperatingCost: 0.0,
//       depreciationRate: 0.0,
//       currentBookValue: 350.0,
//       maintenanceCostYTD: 0.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2025-CHEM-005",
//       vendor: "ChemSolutions Inc.",
//       purchaseDate: "10-Mar-2025",
//       deliveryDate: "12-Mar-2025",
//       terms: "Net 30",
//       discount: 0.05,
//       totalCost: 350.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Maintenance Department",
//       type: "Internal",
//       contactPerson: "Maintenance Supervisor",
//       phone: "+1-555-0123"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Inventory Check",
//         performedBy: "Warehouse Staff",
//         notes: "Full drum, no usage yet"
//       },
//       {
//         id: "LOG002",
//         date: "15-Mar-2025",
//         action: "Received",
//         performedBy: "Warehouse Staff",
//         notes: "Drum received and stored properly"
//       }
//     ]
//   },
//   // Tools Example - IT Department
//   {
//     id: "TOOLWRENCHSET01",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Heavy Duty Wrench Set (Metric)",
//     serialNo: "HDWS-M-001",
//     rfid: "TOOL001WRENCHRFID",
//     parentAsset: "Tool Inventory",
//     productName: "Professional Wrench Set",
//     categoryName: "Tools > Hand Tools",
//     statusText: "Available",
//     statusColor: "green",
//     assetClass: "Portable Tools",
//     constructionYear: 2022,
//     warrantyStart: "15-Dec-2022",
//     manufacturer: "Craftsman",
//     outOfOrder: "No",
//     isActive: "Yes",
//     category: "Tools", // Main category for filtering
//     department: "IT", // Department that uses these tools
//     size: "Standard",
//     costPrice: 120.0,
//     productionHoursDaily: 0.0,
//     serviceStatus: "Available",
//     description: "Complete set of metric heavy-duty wrenches for various tasks.",
//     lastEnquiryDate: "17-May-2025",
//     productionTime: "As needed",
//     lineNumber: "Tool Crib A",
//     assetType: "Reusable",
//     commissioningDate: "01-Jan-2023",
//     endOfWarranty: "15-Dec-2025",
//     expectedLifeSpan: 5,
//     deleted: "No",
//     allocated: "Tool Crib A",
//     allocatedOn: "01-Jan-2023",
//     uom: "Set",
//     salesPrice: 0.0,
//     lastEnquiryBy: "IT Technician",
//     shelfLifeInMonth: 0,
//     location: "Tool Crib A", // Added for list view
//     purchaseDate: "15-Dec-2022", // Added for list view
//     purchasePrice: 120, // Added for list view
//     condition: "good", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "8mm Wrench",
//         partNumber: "WR-8MM-001",
//         quantity: 1,
//         unitCost: 8.00,
//         supplier: "Craftsman",
//         lastReplaced: "N/A"
//       },
//       {
//         id: "BOM002",
//         partName: "10mm Wrench",
//         partNumber: "WR-10MM-001",
//         quantity: 1,
//         unitCost: 9.00,
//         supplier: "Craftsman",
//         lastReplaced: "N/A"
//       },
//       {
//         id: "BOM003",
//         partName: "Tool Case",
//         partNumber: "TC-WRENCH-001",
//         quantity: 1,
//         unitCost: 25.00,
//         supplier: "Craftsman",
//         lastReplaced: "N/A"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Usage Count",
//         reading: 15.0,
//         unit: "checkouts",
//         recordedDate: "20-May-2025",
//         recordedBy: "Tool Crib System"
//       },
//       {
//         id: "ME002",
//         eventType: "Condition Check",
//         reading: 85.0,
//         unit: "percent",
//         recordedDate: "15-May-2025",
//         recordedBy: "Tool Crib Manager"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Tool Crib Manager",
//         role: "Inventory Manager",
//         email: "toolcrib@company.com",
//         phone: "+1-555-0678",
//         assignedDate: "01-Jan-2023"
//       },
//       {
//         id: "PER002",
//         name: "IT Technician",
//         role: "Primary User",
//         email: "it.tech@company.com",
//         phone: "+1-555-0901",
//         assignedDate: "01-Jan-2023"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Craftsman",
//       type: "Limited Warranty",
//       startDate: "15-Dec-2022",
//       endDate: "15-Dec-2025",
//       coverage: "Manufacturing Defects",
//       terms: "Replace or repair defective tools",
//       contactInfo: "1-800-CRAFTSMAN",
//       claimHistory: []
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "IT Support Services",
//         type: "Support Unit",
//         contactPerson: "IT Manager",
//         phone: "+1-555-0234"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Tool Specifications",
//         type: "PDF",
//         size: "1.2 MB",
//         uploadDate: "15-Dec-2022",
//         uploadedBy: "Tool Crib Manager"
//       },
//       {
//         id: "FILE002",
//         name: "Usage Log",
//         type: "XLSX",
//         size: "0.3 MB",
//         uploadDate: "01-May-2025",
//         uploadedBy: "Tool Crib Manager"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 120.0,
//       annualOperatingCost: 0.0,
//       depreciationRate: 0.20,
//       currentBookValue: 72.0,
//       maintenanceCostYTD: 0.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2022-TOOL-001",
//       vendor: "Craftsman",
//       purchaseDate: "15-Dec-2022",
//       deliveryDate: "20-Dec-2022",
//       terms: "Net 30",
//       discount: 0.15,
//       totalCost: 120.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "IT Department",
//       type: "Internal",
//       contactPerson: "IT Manager",
//       phone: "+1-555-0234"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Checked Out",
//         performedBy: "IT Technician",
//         notes: "Checked out for server maintenance"
//       },
//       {
//         id: "LOG002",
//         date: "15-May-2025",
//         action: "Condition Inspection",
//         performedBy: "Tool Crib Manager",
//         notes: "All tools in good condition"
//       }
//     ]
//   },
//   // Another Equipment Example - HVAC Department
//   {
//     id: "EQPFORKLIFT03",
//     imageSrc: "/placeholder.svg?height=150&width=250",
//     assetName: "Electric Forklift - 3 Ton",
//     serialNo: "EFKL-003-SN789",
//     rfid: "EQP003FLRFID",
//     parentAsset: "Warehouse Fleet",
//     productName: "Toyota 8FBE15U",
//     categoryName: "Equipment > Material Handling",
//     statusText: "Maintenance",
//     statusColor: "yellow",
//     assetClass: "Operating Assets",
//     constructionYear: 2020,
//     warrantyStart: "10-Mar-2020",
//     manufacturer: "Toyota Material Handling",
//     outOfOrder: "No", // It's in maintenance, not necessarily out of order
//     isActive: "Yes",
//     category: "Equipment", // Main category for filtering
//     department: "HVAC", // Department that operates this equipment
//     size: "Medium",
//     costPrice: 32000.0,
//     productionHoursDaily: 8.0,
//     serviceStatus: "Under Maintenance",
//     description: "Electric forklift for warehouse operations, 3-ton capacity.",
//     lastEnquiryDate: "19-May-2025",
//     productionTime: "8 hours/day",
//     lineNumber: "Warehouse B Operations",
//     assetType: "Tangible",
//     commissioningDate: "01-Apr-2020",
//     endOfWarranty: "01-Apr-2023",
//     expectedLifeSpan: 12,
//     deleted: "No",
//     allocated: "Warehouse B Operations",
//     allocatedOn: "01-Apr-2020",
//     uom: "Each",
//     salesPrice: 0.0,
//     lastEnquiryBy: "Warehouse Supervisor",
//     shelfLifeInMonth: 0,
//     location: "Warehouse B - Charging Station", // Added for list view
//     purchaseDate: "01-Mar-2020", // Added for list view
//     purchasePrice: 32000, // Added for list view
//     condition: "fair", // Added for list view
//     partsBOM: [
//       {
//         id: "BOM001",
//         partName: "Battery Pack",
//         partNumber: "BP-TOYOTA-48V",
//         quantity: 1,
//         unitCost: 3500.00,
//         supplier: "Toyota Material Handling",
//         lastReplaced: "15-Jan-2024"
//       },
//       {
//         id: "BOM002",
//         partName: "Fork Assembly",
//         partNumber: "FA-3TON-001",
//         quantity: 1,
//         unitCost: 850.00,
//         supplier: "Toyota Material Handling",
//         lastReplaced: "N/A"
//       },
//       {
//         id: "BOM003",
//         partName: "Hydraulic Fluid",
//         partNumber: "HF-TOYOTA-001",
//         quantity: 15,
//         unitCost: 18.50,
//         supplier: "Toyota Material Handling",
//         lastReplaced: "10-Dec-2024"
//       }
//     ],
//     meteringEvents: [
//       {
//         id: "ME001",
//         eventType: "Operating Hours",
//         reading: 8750.0,
//         unit: "hours",
//         recordedDate: "20-May-2025",
//         recordedBy: "Warehouse Supervisor"
//       },
//       {
//         id: "ME002",
//         eventType: "Battery Cycles",
//         reading: 2145.0,
//         unit: "cycles",
//         recordedDate: "20-May-2025",
//         recordedBy: "Maintenance Tech"
//       }
//     ],
//     personnel: [
//       {
//         id: "PER001",
//         name: "Warehouse Supervisor",
//         role: "Operations Manager",
//         email: "warehouse.super@company.com",
//         phone: "+1-555-0789",
//         assignedDate: "01-Apr-2020"
//       },
//       {
//         id: "PER002",
//         name: "Forklift Operator",
//         role: "Equipment Operator",
//         email: "forklift.ops@company.com",
//         phone: "+1-555-0012",
//         assignedDate: "15-Apr-2020"
//       }
//     ],
//     warrantyDetails: {
//       provider: "Toyota Material Handling",
//       type: "Basic Warranty",
//       startDate: "01-Apr-2020",
//       endDate: "01-Apr-2023",
//       coverage: "Manufacturing Defects",
//       terms: "Standard warranty terms",
//       contactInfo: "1-800-TOYOTA-MH",
//       claimHistory: [
//         {
//           claimNumber: "TM-2022-001",
//           date: "20-Aug-2022",
//           issue: "Hydraulic leak",
//           status: "Closed",
//           cost: 0.0
//         }
//       ]
//     },
//     businesses: [
//       {
//         id: "BUS001",
//         name: "Warehouse Operations",
//         type: "Operating Unit",
//         contactPerson: "Warehouse Manager",
//         phone: "+1-555-0345"
//       }
//     ],
//     files: [
//       {
//         id: "FILE001",
//         name: "Operator Manual",
//         type: "PDF",
//         size: "4.2 MB",
//         uploadDate: "01-Apr-2020",
//         uploadedBy: "Warehouse Supervisor"
//       },
//       {
//         id: "FILE002",
//         name: "Maintenance Records",
//         type: "PDF",
//         size: "2.8 MB",
//         uploadDate: "01-May-2025",
//         uploadedBy: "Maintenance Tech"
//       }
//     ],
//     financials: {
//       totalCostOfOwnership: 45000.0,
//       annualOperatingCost: 5200.0,
//       depreciationRate: 0.12,
//       currentBookValue: 18000.0,
//       maintenanceCostYTD: 2800.0,
//       fuelCostYTD: 0.0
//     },
//     purchaseInfo: {
//       purchaseOrderNumber: "PO-2020-WH-001",
//       vendor: "Toyota Material Handling",
//       purchaseDate: "01-Mar-2020",
//       deliveryDate: "25-Mar-2020",
//       terms: "Net 30",
//       discount: 0.08,
//       totalCost: 32000.0
//     },
//     associatedCustomer: {
//       id: "CUST001",
//       name: "Warehouse Operations",
//       type: "Internal",
//       contactPerson: "Warehouse Manager",
//       phone: "+1-555-0345"
//     },
//     log: [
//       {
//         id: "LOG001",
//         date: "20-May-2025",
//         action: "Maintenance Started",
//         performedBy: "Maintenance Tech",
//         notes: "Battery maintenance and inspection"
//       },
//       {
//         id: "LOG002",
//         date: "15-Jan-2024",
//         action: "Battery Replacement",
//         performedBy: "Maintenance Tech",
//         notes: "Replaced main battery pack"
//       }
//     ]
//   },
// ]
