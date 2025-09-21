const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Define the column headers as per our specification
const headers = [
  'asset_name',
  'serial_number', 
  'rfid',
  'category_name',
  'product_name',
  'manufacturer',
  'model',
  'location_name',
  'department_name',
  'purchase_date',
  'warranty_expiry',
  'purchase_cost',
  'status',
  'description',
  'parent_asset_serial'
];

// Sample asset data
const sampleAssets = [
  {
    asset_name: 'Central AC Unit 001',
    serial_number: 'ACU-2024-001',
    rfid: 'RFID001',
    category_name: 'HVAC Equipment',
    product_name: 'Central Air Conditioning Unit',
    manufacturer: 'Carrier',
    model: '24ABC6-A01',
    location_name: 'Building A - Main Floor',
    department_name: 'Maintenance',
    purchase_date: '2024-01-15',
    warranty_expiry: '2027-01-15',
    purchase_cost: 5000,
    status: 'active',
    description: 'Main lobby central air conditioning unit with smart controls',
    parent_asset_serial: ''
  },
  {
    asset_name: 'Dell Laptop - Engineering 01',
    serial_number: 'LAP-2024-001',
    rfid: 'RFID002',
    category_name: 'IT Equipment',
    product_name: 'Laptop Computer',
    manufacturer: 'Dell',
    model: 'Latitude 5520',
    location_name: 'Office Floor 1 - Desk 15',
    department_name: 'Engineering',
    purchase_date: '2024-02-01',
    warranty_expiry: '2027-02-01',
    purchase_cost: 1200,
    status: 'active',
    description: 'High-performance laptop for software development work',
    parent_asset_serial: ''
  }
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();

// Convert data to worksheet format
const worksheetData = [
  headers,
  ...sampleAssets.map(asset => headers.map(header => asset[header] || ''))
];

const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column widths for better readability
const columnWidths = [
  { wch: 25 }, // asset_name
  { wch: 15 }, // serial_number
  { wch: 12 }, // rfid
  { wch: 20 }, // category_name
  { wch: 25 }, // product_name
  { wch: 15 }, // manufacturer
  { wch: 15 }, // model
  { wch: 25 }, // location_name
  { wch: 15 }, // department_name
  { wch: 12 }, // purchase_date
  { wch: 12 }, // warranty_expiry
  { wch: 12 }, // purchase_cost
  { wch: 10 }, // status
  { wch: 40 }, // description
  { wch: 18 }  // parent_asset_serial
];

worksheet['!cols'] = columnWidths;

// Style the header row
const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  if (!worksheet[cellAddress]) continue;
  
  worksheet[cellAddress].s = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F46E5" } },
    alignment: { horizontal: "center", vertical: "center" }
  };
}

// Add the worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the file
const filePath = path.join(publicDir, 'asset-import-template.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('✅ Asset import template created successfully!');
console.log('📁 File location:', filePath);
console.log('📊 Template includes:');
console.log('   - 15 required columns');
console.log('   - 2 sample asset records');
console.log('   - Proper formatting and column widths');
console.log('   - Styled header row');

// Also create a documentation file
const docContent = `# Asset Import Template Documentation

## File: asset-import-template.xlsx

### Column Specifications:

| Column | Field Name | Data Type | Required | Example |
|--------|------------|-----------|----------|---------|
| A | asset_name | Text | ✅ | Central AC Unit 001 |
| B | serial_number | Text | ✅ | ACU-2024-001 |
| C | rfid | Text | ❌ | RFID001 |
| D | category_name | Text | ✅ | HVAC Equipment |
| E | product_name | Text | ✅ | Central Air Conditioning Unit |
| F | manufacturer | Text | ❌ | Carrier |
| G | model | Text | ❌ | 24ABC6-A01 |
| H | location_name | Text | ✅ | Building A - Main Floor |
| I | department_name | Text | ✅ | Maintenance |
| J | purchase_date | Date | ❌ | 2024-01-15 |
| K | warranty_expiry | Date | ❌ | 2027-01-15 |
| L | purchase_cost | Number | ❌ | 5000 |
| M | status | Text | ❌ | active |
| N | description | Text | ❌ | Main lobby central air conditioning unit |
| O | parent_asset_serial | Text | ❌ | (Leave empty if no parent) |

### Validation Rules:

1. **asset_name**: 3-100 characters, alphanumeric + spaces
2. **serial_number**: Must be unique, 5-50 characters
3. **rfid**: Must be unique if provided, 8-20 characters
4. **category_name**: Must exist in your system
5. **location_name**: Must exist in your system
6. **department_name**: Must exist in your system
7. **purchase_date**: YYYY-MM-DD format
8. **warranty_expiry**: YYYY-MM-DD format
9. **purchase_cost**: Positive number
10. **status**: One of: active, inactive, maintenance
11. **description**: Maximum 500 characters
12. **parent_asset_serial**: Must exist in system if provided

### Usage Instructions:

1. Download the template file
2. Fill in your asset data following the format
3. Ensure all required fields are completed
4. Upload the file using the Excel Import feature
5. Review and verify the parsed data
6. Click "Create All Assets" to bulk import

### Sample Data Included:

The template includes 2 sample assets:
- Central AC Unit with HVAC category
- Dell Laptop with IT Equipment category

You can modify or delete these samples and add your own data.
`;

const docPath = path.join(publicDir, 'asset-import-template-docs.md');
fs.writeFileSync(docPath, docContent);

console.log('📄 Documentation created:', docPath);
