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
  console.log('🔧 [Duplication Utils] - Starting sanitization');
  console.log('🔧 [Duplication Utils] - Original data keys:', Object.keys(originalData));
  
  const excludeFields = [...DEFAULT_EXCLUDE_FIELDS, ...(config.excludeFields || [])];
  console.log('🔧 [Duplication Utils] - Exclude fields:', excludeFields);
  console.log('🔧 [Duplication Utils] - Transform fields:', Object.keys(config.transformFields || {}));
  
  const sanitizedData: Partial<T> = {};

  for (const [key, value] of Object.entries(originalData)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) {
      console.log(`🔧 [Duplication Utils] - Excluding field: ${key}`);
      continue;
    }

    // Apply field transformations if configured
    if (config.transformFields && config.transformFields[key]) {
      const newValue = config.transformFields[key](value);
      console.log(`🔧 [Duplication Utils] - Transforming field: ${key} -> ${typeof newValue === 'object' ? JSON.stringify(newValue) : newValue}`);
      sanitizedData[key as keyof T] = newValue;
    } else {
      // Deep clone to avoid reference issues
      console.log(`🔧 [Duplication Utils] - Preserving field: ${key} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      sanitizedData[key as keyof T] = deepClone(value);
    }
  }

  console.log('🔧 [Duplication Utils] - Final sanitized keys:', Object.keys(sanitizedData));
  console.log('🔧 [Duplication Utils] - Critical fields in sanitized data:');
  console.log('  - area:', sanitizedData.area);
  console.log('  - departmentId:', sanitizedData.departmentId);
  console.log('  - assetId:', sanitizedData.assetId);
  console.log('  - natureOfProblem:', sanitizedData.natureOfProblem);
  console.log('  - commentsOrSolution:', sanitizedData.commentsOrSolution);
  console.log('  - attendedBy:', sanitizedData.attendedBy);

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
 * Daily Log Activity-specific duplication configuration
 */
export const DAILY_LOG_ACTIVITY_DUPLICATION_CONFIG: DuplicationConfig = {
  nameField: 'natureOfProblem',
  excludeFields: [
    'activityId', // Activity IDs should be unique
    '_id', // MongoDB ID should be unique
    'id', // ID should be unique
    'createdBy', // Will be set to current user
    'createdByName', // Will be set to current user
    'createdAt', // Will be set by system
    'updatedAt', // Will be set by system
    'adminVerified', // Reset verification status
    'adminVerifiedBy', // Clear admin verification
    'adminVerifiedByName', // Clear admin verification name
    'adminVerifiedAt', // Clear admin verification timestamp
    'adminNotes', // Clear admin notes
    'verifiedBy', // Clear verification
    'verifiedByName', // Clear verification name
    'verificationNotes', // Clear verification notes
    'activityHistory', // Clear activity history
  ],
  transformFields: {
    // Reset status to open for new duplicated activities
    status: () => 'open',
    // Reset date and time to current
    date: () => new Date(),
    time: () => new Date().toTimeString().slice(0, 5),
    startTime: () => new Date().toTimeString().slice(0, 5),
    endTime: () => null, // Use null instead of empty string
    // Reset downtime for fresh tracking
    downtime: () => null,
    downtimeType: () => null, // Use null instead of undefined
    // Reset verification fields
    adminVerified: () => false,
    adminVerifiedBy: () => null,
    adminVerifiedByName: () => null,
    adminVerifiedAt: () => null,
    adminNotes: () => null,
    verifiedBy: () => null,
    verifiedByName: () => null,
    verificationNotes: () => null,
    // Ensure activity history is empty array
    activityHistory: () => []
  },
  generateSuffix: (originalName: string) => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `Copy_${timestamp}`;
  }
};

/**
 * Safety Inspection Schedule-specific duplication configuration
 */
export const SAFETY_INSPECTION_DUPLICATION_CONFIG: DuplicationConfig = {
  nameField: 'title',
  excludeFields: [
    'scheduleId', // Schedule IDs should be unique
    'nextDueDate', // Due dates should be recalculated
    'lastCompletedDate', // Completion dates should be reset
    'recordsCount', // Record counts should start at 0
    'complianceScore', // Scores should be reset
    'status' // Status should be reset to active
  ],
  transformFields: {
    // Reset status to active for new duplicated schedules
    status: () => 'active',
    // Reset completion tracking
    lastCompletedDate: () => '',
    recordsCount: () => 0,
    complianceScore: () => 0,
    // Reset due dates - will be calculated by backend
    nextDueDate: () => '',
    // Update start date to today
    startDate: () => new Date().toISOString().split('T')[0],
    // Reset tracking fields
    isOverdue: () => false
  },
  generateSuffix: (originalName: string) => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `Copy_${timestamp}`;
  }
};

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
  moduleType: 'assets' | 'maintenance' | 'employees' | 'tickets' | 'safety-inspection' | 'daily-log-activities',
  additionalParams?: Record<string, any>
): Promise<boolean> {
  try {
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (!token) {
      throw new Error('Authentication required');
    }

    // Construct API endpoint based on module type
    let baseUrl;
    switch (moduleType) {
      case 'safety-inspection':
        baseUrl = `/api/safety-inspection/schedules`;
        break;
      case 'daily-log-activities':
        baseUrl = `/api/daily-log-activities`;
        break;
      default:
        baseUrl = `/api/${moduleType}`;
    }
    
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
      case 'safety-inspection':
        searchParam.append('title', name);
        searchParam.append('exact', 'true');
        break;
      case 'daily-log-activities':
        searchParam.append('search', name);
        searchParam.append('exact', 'true');
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
          const itemName = item.assetName || item.title || item.name || item.natureOfProblem || '';
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
  moduleType: 'assets' | 'maintenance' | 'employees' | 'tickets' | 'safety-inspection' | 'daily-log-activities',
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
