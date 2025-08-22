// Validation utility functions for forms

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: "active" | "inactive" | "on-leave";
  password: string;
  accessLevel: "super_admin" | "department_admin" | "normal_user";
}

export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  manager: string;
  status: "active" | "inactive";
  managerEmail?: string;
  managerPhone?: string;
  managerPassword?: string;
}

export interface LocationFormData {
  name: string;
  code: string;
  type: string;
  department: string;
  parentLocation: string;
  address: string;
  description: string;
}

// Common validation functions
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Company domain validation - allow both @gmail.com and @tyjfood.com
  const allowedDomains = ['@gmail.com', '@tyjfood.com'];
  const emailLower = trimmed.toLowerCase();
  const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
  
  if (!hasValidDomain) {
    return { isValid: false, error: 'Only email addresses with @gmail.com or @tyjfood.com domains are allowed' };
  }
  
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters to count actual digits
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must have at least 10 digits' };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number cannot exceed 15 digits' };
  }
  
  // Check for valid phone format (digits, spaces, dashes, parentheses, plus sign)
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,20}$/;
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Phone number contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string, isRequired: boolean = true): ValidationResult => {
  if (!isRequired && !password.trim()) {
    return { isValid: true };
  }
  
  const trimmed = password.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (trimmed.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (trimmed.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters' };
  }
  
  return { isValid: true };
};

export const validateLength = (value: string, fieldName: string, min: number, max: number): ValidationResult => {
  const trimmed = value.trim();
  
  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters long` };
  }
  
  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  
  return { isValid: true };
};

export const validateCode = (code: string): ValidationResult => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'Department code is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Department code must be at least 2 characters long' };
  }
  
  if (trimmed.length > 10) {
    return { isValid: false, error: 'Department code cannot exceed 10 characters' };
  }
  
  // Only letters and numbers allowed
  const codeRegex = /^[A-Z0-9]+$/;
  if (!codeRegex.test(trimmed)) {
    return { isValid: false, error: 'Department code can only contain letters and numbers' };
  }
  
  return { isValid: true };
};

// Employee validation
export const validateEmployeeForm = (formData: EmployeeFormData, isEdit: boolean = false): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameValidation = validateRequired(formData.name, 'Name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  } else {
    const lengthValidation = validateLength(formData.name, 'Name', 1, 100);
    if (!lengthValidation.isValid) {
      errors.name = lengthValidation.error!;
    }
  }
  
  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }
  
  // Phone validation
  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.error!;
  }
  
  // Department validation
  const departmentValidation = validateRequired(formData.department, 'Department');
  if (!departmentValidation.isValid) {
    errors.department = departmentValidation.error!;
  }
  
  // Role validation
  const roleValidation = validateRequired(formData.role, 'Role');
  if (!roleValidation.isValid) {
    errors.role = roleValidation.error!;
  } else {
    const roleLengthValidation = validateLength(formData.role, 'Role', 1, 50);
    if (!roleLengthValidation.isValid) {
      errors.role = roleLengthValidation.error!;
    }
  }
  
  // Password validation (required for new employees, optional for edits)
  const passwordValidation = validatePassword(formData.password, !isEdit);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Department validation
export const validateDepartmentForm = (formData: DepartmentFormData, isEdit: boolean = false): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameValidation = validateRequired(formData.name, 'Department name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  } else {
    const lengthValidation = validateLength(formData.name, 'Department name', 2, 100);
    if (!lengthValidation.isValid) {
      errors.name = lengthValidation.error!;
    }
  }
  
  // Code validation
  const codeValidation = validateCode(formData.code);
  if (!codeValidation.isValid) {
    errors.code = codeValidation.error!;
  }
  
  // Description validation
  const descriptionValidation = validateRequired(formData.description, 'Description');
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  } else {
    const descLengthValidation = validateLength(formData.description, 'Description', 10, 500);
    if (!descLengthValidation.isValid) {
      errors.description = descLengthValidation.error!;
    }
  }
  
  // Manager validation
  const managerValidation = validateRequired(formData.manager, 'Manager name');
  if (!managerValidation.isValid) {
    errors.manager = managerValidation.error!;
  } else {
    const managerLengthValidation = validateLength(formData.manager, 'Manager name', 2, 100);
    if (!managerLengthValidation.isValid) {
      errors.manager = managerLengthValidation.error!;
    }
  }
  
  // Manager employee validation (only for new departments)
  if (!isEdit) {
    if (formData.managerEmail) {
      const managerEmailValidation = validateEmail(formData.managerEmail);
      if (!managerEmailValidation.isValid) {
        errors.managerEmail = managerEmailValidation.error!;
      }
    } else {
      errors.managerEmail = 'Manager email is required for new departments';
    }
    
    if (formData.managerPhone) {
      const managerPhoneValidation = validatePhone(formData.managerPhone);
      if (!managerPhoneValidation.isValid) {
        errors.managerPhone = managerPhoneValidation.error!;
      }
    } else {
      errors.managerPhone = 'Manager phone is required for new departments';
    }
    
    if (formData.managerPassword) {
      const managerPasswordValidation = validatePassword(formData.managerPassword, true);
      if (!managerPasswordValidation.isValid) {
        errors.managerPassword = managerPasswordValidation.error!;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Location validation
export const validateLocationForm = (formData: LocationFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameValidation = validateRequired(formData.name, 'Location name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  } else {
    const lengthValidation = validateLength(formData.name, 'Location name', 2, 100);
    if (!lengthValidation.isValid) {
      errors.name = lengthValidation.error!;
    }
  }
  
  // Code validation
  const codeValidation = validateCode(formData.code);
  if (!codeValidation.isValid) {
    errors.code = codeValidation.error!;
  }
  
  // Type validation
  const typeValidation = validateRequired(formData.type, 'Location type');
  if (!typeValidation.isValid) {
    errors.type = typeValidation.error!;
  } else {
    const typeLengthValidation = validateLength(formData.type, 'Location type', 2, 50);
    if (!typeLengthValidation.isValid) {
      errors.type = typeLengthValidation.error!;
    }
  }
  
  // Department validation
  const departmentValidation = validateRequired(formData.department, 'Department');
  if (!departmentValidation.isValid) {
    errors.department = departmentValidation.error!;
  }
  
  // Address validation
  if (formData.address.trim()) {
    const addressLengthValidation = validateLength(formData.address, 'Address', 5, 200);
    if (!addressLengthValidation.isValid) {
      errors.address = addressLengthValidation.error!;
    }
  }
  
  // Description validation
  if (formData.description.trim()) {
    const descLengthValidation = validateLength(formData.description, 'Description', 10, 500);
    if (!descLengthValidation.isValid) {
      errors.description = descLengthValidation.error!;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time field validation for instant feedback
export const validateField = (fieldName: keyof (EmployeeFormData & DepartmentFormData & LocationFormData), value: string, context?: any): ValidationResult => {
  switch (fieldName) {
    case 'name':
      const nameReq = validateRequired(value, 'Name');
      if (!nameReq.isValid) return nameReq;
      return validateLength(value, 'Name', 1, 100);
      
    case 'email':
    case 'managerEmail':
      return validateEmail(value);
      
    case 'phone':
    case 'managerPhone':
      return validatePhone(value);
      
    case 'password':
    case 'managerPassword':
      const isRequired = context?.isRequired !== false;
      return validatePassword(value, isRequired);
      
    case 'department':
      return validateRequired(value, 'Department');
      
    case 'role':
      const roleReq = validateRequired(value, 'Role');
      if (!roleReq.isValid) return roleReq;
      return validateLength(value, 'Role', 1, 50);
      
    case 'code':
      return validateCode(value);
      
    case 'description':
      const descReq = validateRequired(value, 'Description');
      if (!descReq.isValid) return descReq;
      return validateLength(value, 'Description', 10, 500);
      
    case 'manager':
      const managerReq = validateRequired(value, 'Manager name');
      if (!managerReq.isValid) return managerReq;
      return validateLength(value, 'Manager name', 2, 100);
    
    case 'type':
      const typeReq = validateRequired(value, 'Location type');
      if (!typeReq.isValid) return typeReq;
      return validateLength(value, 'Location type', 2, 50);
    
    case 'address':
      if (!value.trim()) return { isValid: true }; // Optional field
      return validateLength(value, 'Address', 5, 200);
      
    default:
      return { isValid: true };
  }
};
