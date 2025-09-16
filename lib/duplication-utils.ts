/**
 * Comprehensive duplication utilities for CMMS modules
 * Provides secure, reusable duplication functionality across different modules
 */

export interface DuplicationConfig {
  nameField: string; // The field that contains the name/title
  excludeFields?: string[]; // Fields to exclude from duplication
  transformFields?: Record<string, (value: any) => any>; // Transform specific fields
  validateNameUnique?: (name: string, moduleType: string) => Promise<boolean>;
  generateSuffix?: (originalName: string) => string;
}

export interface DuplicationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Default fields that should be excluded from duplication across all modules
 */
const DEFAULT_EXCLUDE_FIELDS = [
  'id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'lastModified', 'version', '__v'
];

/**
 * Sanitizes and prepares data for duplication
 */
export function sanitizeDataForDuplication<T extends Record<string, any>>(
  originalData: T,
  config: DuplicationConfig
): Partial<T> {
  const excludeFields = [...DEFAULT_EXCLUDE_FIELDS, ...(config.excludeFields || [])];
  const sanitizedData: Partial<T> = {};

  for (const [key, value] of Object.entries(originalData)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) {
      continue;
    }

    // Apply field transformations if configured
    if (config.transformFields && config.transformFields[key]) {
      sanitizedData[key as keyof T] = config.transformFields[key](value);
    } else {
      // Deep clone to avoid reference issues
      sanitizedData[key as keyof T] = deepClone(value);
    }
  }

  return sanitizedData;
}

/**
 * Generates a unique name for duplicated item
 */
export function generateDuplicateName(
  originalName: string,
  suffix?: string
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  
  if (suffix) {
    return `${originalName} ${suffix}`;
  }
  
  // Default pattern: "Original Name - Copy (YYYYMMDD_HHMMSS)"
  return `${originalName} - Copy (${timestamp})`;
}

/**
 * Validates the new name for duplication
 */
export function validateDuplicateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must not exceed 100 characters' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Deep clone utility to avoid reference issues
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Asset-specific duplication configuration
 */
export const ASSET_DUPLICATION_CONFIG: DuplicationConfig = {
  nameField: 'assetName',
  excludeFields: [
    'serialNo', // Serial numbers should be unique
    'rfid', // RFID tags should be unique
    'qrCodeSrc', // QR codes should be regenerated
    'qrCodeFile',
    'originalQrCodeSrc',
    'assetTag', // Asset tags should be unique
    'allocatedOn', // Allocation date should be reset
    'lastEnquiryDate', // Inquiry dates should be reset
    'lastEnquiryBy' // Inquiry person should be reset
  ],
  transformFields: {
    // Reset status to Available for new duplicated assets
    statusText: () => 'Available',
    statusColor: () => 'green' as const,
    // Reset allocation
    allocated: () => '',
    // Reset some operational fields
    outOfOrder: () => 'No' as const,
    isActive: () => 'Yes' as const,
    // Clear image files (keep URLs but clear file objects)
    imageFile: () => null,
    qrCodeFile: () => null,
    // Reset dates that should not be copied
    purchaseDate: () => '',
    commissioningDate: () => '',
    warrantyStart: () => '',
    endOfWarranty: () => '',
    allocatedOn: () => '',
    lastEnquiryDate: () => ''
  },
  generateSuffix: (originalName: string) => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `Copy_${timestamp}`;
  }
};

/**
 * Checks if a name already exists in the specified module
 */
export async function checkNameExists(
  name: string, 
  moduleType: 'assets' | 'maintenance' | 'employees' | 'tickets',
  additionalParams?: Record<string, any>
): Promise<boolean> {
  try {
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (!token) {
      throw new Error('Authentication required');
    }

    // Construct API endpoint based on module type
    const baseUrl = `/api/${moduleType}`;
    const searchParam = new URLSearchParams();
    
    // Add name search parameter based on module type
    switch (moduleType) {
      case 'assets':
        searchParam.append('search', name);
        searchParam.append('exact', 'true');
        break;
      case 'maintenance':
        searchParam.append('title', name);
        break;
      case 'employees':
        searchParam.append('name', name);
        break;
      case 'tickets':
        searchParam.append('title', name);
        break;
    }

    // Add additional parameters if provided
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        searchParam.append(key, String(value));
      });
    }

    const response = await fetch(`${baseUrl}?${searchParam.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to check name uniqueness:', response.status);
      return false; // Assume unique if check fails
    }

    const data = await response.json();
    
    // Check if any results match exactly
    if (data.success && data.data) {
      const items = Array.isArray(data.data) ? data.data : [data.data];
      return items.some((item: any) => {
        const itemName = item.assetName || item.title || item.name || '';
        return itemName.toLowerCase().trim() === name.toLowerCase().trim();
      });
    }

    return false;
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    return false; // Assume unique if check fails
  }
}

/**
 * Generates a unique name by checking against existing items
 */
export async function generateUniqueName(
  originalName: string,
  moduleType: 'assets' | 'maintenance' | 'employees' | 'tickets',
  maxAttempts: number = 10
): Promise<string> {
  let attempt = 1;
  let newName = generateDuplicateName(originalName);

  while (attempt <= maxAttempts) {
    const exists = await checkNameExists(newName, moduleType);
    if (!exists) {
      return newName;
    }

    // Generate a new name with attempt number
    newName = generateDuplicateName(originalName, `Copy_${attempt}`);
    attempt++;
  }

  // If we couldn't find a unique name, add timestamp
  const timestamp = Date.now();
  return generateDuplicateName(originalName, `Copy_${timestamp}`);
}
