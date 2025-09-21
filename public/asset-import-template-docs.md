# Asset Import Template Documentation

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
