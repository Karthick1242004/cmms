import * as XLSX from 'xlsx';
import { rateLimit } from './rate-limit';

// Security configuration
export const EXCEL_SECURITY_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB limit
  allowedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ],
  allowedExtensions: ['.xlsx', '.xls', '.csv'],
  maxRows: 1000, // Prevent DoS attacks with huge files
  maxCellLength: 1000 // Prevent memory exhaustion
};

// Rate limiting for Excel uploads
export const excelUploadRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 5 // 5 uploads per minute per user
});

// Excel column schema definition
export interface ExcelColumnSchema {
  key: string;
  header: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'enum';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enumValues?: string[];
  validate?: (value: any) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface ExcelRowValidation {
  rowNumber: number;
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  data: Record<string, any>;
}

// Asset Excel schema following our template
export const ASSET_EXCEL_SCHEMA: ExcelColumnSchema[] = [
  {
    key: 'asset_name',
    header: 'asset_name',
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
    validate: (value: string) => {
      const trimmed = value?.toString().trim();
      if (!trimmed) return { isValid: false, error: 'Asset name is required' };
      if (trimmed.length < 3) return { isValid: false, error: 'Asset name must be at least 3 characters' };
      if (trimmed.length > 100) return { isValid: false, error: 'Asset name cannot exceed 100 characters' };
      if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmed)) {
        return { isValid: false, error: 'Asset name contains invalid characters' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'serial_number',
    header: 'serial_number',
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 50,
    pattern: /^[A-Z0-9\-]+$/,
    validate: (value: string) => {
      const trimmed = value?.toString().trim().toUpperCase();
      if (!trimmed) return { isValid: false, error: 'Serial number is required' };
      if (trimmed.length < 5) return { isValid: false, error: 'Serial number must be at least 5 characters' };
      if (trimmed.length > 50) return { isValid: false, error: 'Serial number cannot exceed 50 characters' };
      if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
        return { isValid: false, error: 'Serial number can only contain letters, numbers, and hyphens' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'rfid',
    header: 'rfid',
    required: false,
    type: 'string',
    minLength: 8,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/,
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const trimmed = value.toString().trim().toUpperCase();
      if (trimmed.length < 8) return { isValid: false, error: 'RFID must be at least 8 characters' };
      if (trimmed.length > 20) return { isValid: false, error: 'RFID cannot exceed 20 characters' };
      if (!/^[A-Z0-9]+$/.test(trimmed)) {
        return { isValid: false, error: 'RFID can only contain letters and numbers' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'category_name',
    header: 'category_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    validate: (value: string) => {
      const trimmed = value?.toString().trim();
      if (!trimmed) return { isValid: false, error: 'Category name is required' };
      if (trimmed.length < 2) return { isValid: false, error: 'Category name must be at least 2 characters' };
      if (trimmed.length > 100) return { isValid: false, error: 'Category name cannot exceed 100 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'product_name',
    header: 'product_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    validate: (value: string) => {
      const trimmed = value?.toString().trim();
      if (!trimmed) return { isValid: false, error: 'Product name is required' };
      if (trimmed.length < 2) return { isValid: false, error: 'Product name must be at least 2 characters' };
      if (trimmed.length > 100) return { isValid: false, error: 'Product name cannot exceed 100 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'manufacturer',
    header: 'manufacturer',
    required: false,
    type: 'string',
    maxLength: 100,
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const trimmed = value.toString().trim();
      if (trimmed.length > 100) return { isValid: false, error: 'Manufacturer cannot exceed 100 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'model',
    header: 'model',
    required: false,
    type: 'string',
    maxLength: 100,
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const trimmed = value.toString().trim();
      if (trimmed.length > 100) return { isValid: false, error: 'Model cannot exceed 100 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'location_name',
    header: 'location_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    validate: (value: string) => {
      const trimmed = value?.toString().trim();
      if (!trimmed) return { isValid: false, error: 'Location name is required' };
      if (trimmed.length < 2) return { isValid: false, error: 'Location name must be at least 2 characters' };
      if (trimmed.length > 100) return { isValid: false, error: 'Location name cannot exceed 100 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'department_name',
    header: 'department_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    validate: (value: string) => {
      const trimmed = value?.toString().trim();
      if (!trimmed) return { isValid: false, error: 'Department name is required' };
      if (trimmed.length < 2) return { isValid: false, error: 'Department name must be at least 2 characters' };
      if (trimmed.length > 50) return { isValid: false, error: 'Department name cannot exceed 50 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'purchase_date',
    header: 'purchase_date',
    required: false,
    type: 'date',
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const dateStr = value.toString().trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return { isValid: false, error: 'Purchase date must be in YYYY-MM-DD format' };
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid purchase date' };
      }
      if (date > new Date()) {
        return { isValid: false, error: 'Purchase date cannot be in the future' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'warranty_expiry',
    header: 'warranty_expiry',
    required: false,
    type: 'date',
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const dateStr = value.toString().trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return { isValid: false, error: 'Warranty expiry must be in YYYY-MM-DD format' };
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid warranty expiry date' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'purchase_cost',
    header: 'purchase_cost',
    required: false,
    type: 'number',
    validate: (value: string | number) => {
      if (!value && value !== 0) return { isValid: true }; // Optional field
      const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
      if (isNaN(numValue)) {
        return { isValid: false, error: 'Purchase cost must be a valid number' };
      }
      if (numValue < 0) {
        return { isValid: false, error: 'Purchase cost cannot be negative' };
      }
      if (numValue > 10000000) {
        return { isValid: false, error: 'Purchase cost cannot exceed 10,000,000' };
      }
      return { isValid: true };
    }
  },
  {
    key: 'status',
    header: 'status',
    required: false,
    type: 'enum',
    enumValues: ['Available', 'In Use', 'Maintenance', 'Out of Service'],
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field, defaults to 'Available'
      const trimmed = value.toString().trim();
      const validStatuses = ['Available', 'In Use', 'Maintenance', 'Out of Service'];
      if (!validStatuses.includes(trimmed)) {
        return { isValid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
      }
      return { isValid: true };
    }
  },
  {
    key: 'description',
    header: 'description',
    required: false,
    type: 'string',
    maxLength: 500,
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const trimmed = value.toString().trim();
      if (trimmed.length > 500) return { isValid: false, error: 'Description cannot exceed 500 characters' };
      return { isValid: true };
    }
  },
  {
    key: 'parent_asset_serial',
    header: 'parent_asset_serial',
    required: false,
    type: 'string',
    maxLength: 50,
    validate: (value: string) => {
      if (!value || !value.toString().trim()) return { isValid: true }; // Optional field
      const trimmed = value.toString().trim().toUpperCase();
      if (trimmed.length > 50) return { isValid: false, error: 'Parent asset serial cannot exceed 50 characters' };
      if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
        return { isValid: false, error: 'Parent asset serial can only contain letters, numbers, and hyphens' };
      }
      return { isValid: true };
    }
  }
];

/**
 * Security validation for uploaded files
 */
export function validateFileUpload(file: File): ValidationResult {
  // File size check
  if (file.size > EXCEL_SECURITY_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds limit. Maximum allowed: ${EXCEL_SECURITY_CONFIG.maxFileSize / (1024 * 1024)}MB`
    };
  }

  // MIME type check
  if (!EXCEL_SECURITY_CONFIG.allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed'
    };
  }

  // Extension check (additional security layer)
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!EXCEL_SECURITY_CONFIG.allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only .xlsx, .xls, and .csv files are allowed'
    };
  }

  // File name validation (prevent path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid file name'
    };
  }

  return { isValid: true };
}

/**
 * Validate Excel structure and headers
 */
export function validateExcelStructure(headers: string[]): ValidationResult {
  const requiredHeaders = ASSET_EXCEL_SCHEMA
    .filter(col => col.required)
    .map(col => col.header);

  const missingHeaders = requiredHeaders.filter(
    header => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      error: `Missing required columns: ${missingHeaders.join(', ')}`
    };
  }

  // Check for unexpected headers (warn but don't fail)
  const expectedHeaders = ASSET_EXCEL_SCHEMA.map(col => col.header);
  const unexpectedHeaders = headers.filter(
    header => !expectedHeaders.includes(header)
  );

  if (unexpectedHeaders.length > 0) {
    return {
      isValid: true,
      warning: `Unexpected columns will be ignored: ${unexpectedHeaders.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Parse and validate Excel file (Server-side version)
 */
export async function parseExcelFile(fileBuffer: ArrayBuffer): Promise<{
  isValid: boolean;
  headers?: string[];
  rows?: any[][];
  error?: string;
}> {
  try {
    const data = new Uint8Array(fileBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { isValid: false, error: 'No worksheets found in the file' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (jsonData.length === 0) {
      return { isValid: false, error: 'The Excel file is empty' };
    }

    if (jsonData.length > EXCEL_SECURITY_CONFIG.maxRows) {
      return { 
        isValid: false, 
        error: `Too many rows. Maximum allowed: ${EXCEL_SECURITY_CONFIG.maxRows}` 
      };
    }

    const headers = jsonData[0]?.map(header => header?.toString().trim()) || [];
    const rows = jsonData.slice(1);

    // Validate each cell length to prevent memory attacks
    for (const row of rows) {
      for (const cell of row) {
        if (cell?.toString().length > EXCEL_SECURITY_CONFIG.maxCellLength) {
          return { 
            isValid: false, 
            error: `Cell content too long. Maximum allowed: ${EXCEL_SECURITY_CONFIG.maxCellLength} characters` 
          };
        }
      }
    }

    return {
      isValid: true,
      headers,
      rows
    };

  } catch (error) {
    return { 
      isValid: false, 
      error: 'Failed to parse Excel file. Please ensure it is a valid Excel file.' 
    };
  }
}

/**
 * Validate individual row data
 */
export function validateRowData(
  row: any[], 
  headers: string[], 
  rowNumber: number
): ExcelRowValidation {
  const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
  const data: Record<string, any> = {};

  // Map row data to object using headers
  headers.forEach((header, index) => {
    const cellValue = row[index];
    data[header] = cellValue?.toString().trim() || '';
  });

  // Validate each field according to schema
  ASSET_EXCEL_SCHEMA.forEach(schema => {
    const value = data[schema.key];
    const validation = schema.validate ? schema.validate(value) : { isValid: true };

    if (!validation.isValid && validation.error) {
      errors.push({
        field: schema.key,
        message: validation.error,
        severity: 'error'
      });
    }

    if (validation.warning) {
      errors.push({
        field: schema.key,
        message: validation.warning,
        severity: 'warning'
      });
    }
  });

  return {
    rowNumber,
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    data
  };
}

/**
 * Sanitize and normalize data for API submission
 */
export function sanitizeAssetData(rowData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  ASSET_EXCEL_SCHEMA.forEach(schema => {
    const value = rowData[schema.key];
    
    if (!value && value !== 0) {
      // Handle empty/null values
      if (schema.required) {
        throw new Error(`Required field ${schema.key} is missing`);
      }
      return; // Skip optional empty fields
    }

    switch (schema.type) {
      case 'string':
        sanitized[schema.key] = value.toString().trim();
        break;
      case 'number':
        sanitized[schema.key] = parseFloat(value.toString());
        break;
      case 'date':
        sanitized[schema.key] = value.toString().trim();
        break;
      case 'enum':
        sanitized[schema.key] = value.toString().trim().toLowerCase();
        break;
      default:
        sanitized[schema.key] = value.toString().trim();
    }
  });

  // Add default values for optional fields
  if (!sanitized.status) {
    sanitized.status = 'active';
  }

  return sanitized;
}
