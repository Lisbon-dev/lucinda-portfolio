/**
 * Form Validation System
 * Client-side and server-side compatible validation utilities
 */

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: string | number;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldConfig {
  name: string;
  label: string;
  rules: ValidationRule[];
}

export class FormValidator {
  private emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validate a single field value against its rules
   */
  validateField(value: string, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
      const error = this.applyRule(value, rule);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * Validate entire form data
   */
  validateForm(formData: FormData | Record<string, any>, fieldConfigs: FieldConfig[]): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const fieldConfig of fieldConfigs) {
      const value = this.getValue(formData, fieldConfig.name);
      const error = this.validateField(value, fieldConfig.rules);
      
      if (error) {
        errors[fieldConfig.name] = error;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Apply a single validation rule
   */
  private applyRule(value: string, rule: ValidationRule): string | null {
    const trimmedValue = value.trim();

    switch (rule.type) {
      case 'required':
        return trimmedValue.length === 0 ? rule.message : null;

      case 'email':
        if (trimmedValue.length === 0) return null; // Allow empty for non-required fields
        return !this.emailPattern.test(trimmedValue) ? rule.message : null;

      case 'minLength':
        if (trimmedValue.length === 0) return null; // Allow empty for non-required fields
        return trimmedValue.length < (rule.value as number) ? rule.message : null;

      case 'maxLength':
        if (trimmedValue.length === 0) return null; // Allow empty for non-required fields
        return trimmedValue.length > (rule.value as number) ? rule.message : null;

      case 'pattern':
        if (trimmedValue.length === 0) return null; // Allow empty for non-required fields
        const pattern = new RegExp(rule.value as string);
        return !pattern.test(trimmedValue) ? rule.message : null;

      default:
        return null;
    }
  }

  /**
   * Get value from FormData or object
   */
  private getValue(data: FormData | Record<string, any>, name: string): string {
    if (data instanceof FormData) {
      const value = data.get(name);
      // Handle checkbox values
      if (name === 'privacy_consent') {
        return value === 'on' || value === 'true' ? 'true' : '';
      }
      return (value as string) || '';
    }
    // Handle checkbox values in object data
    if (name === 'privacy_consent') {
      return data[name] ? 'true' : '';
    }
    return data[name] || '';
  }
}

/**
 * Predefined validation rule factories
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Must be no more than ${length} characters`,
  }),

  pattern: (pattern: string, message: string): ValidationRule => ({
    type: 'pattern',
    value: pattern,
    message,
  }),
};

/**
 * Contact form validation configuration
 */
export const contactFormConfig: FieldConfig[] = [
  {
    name: 'name',
    label: 'Full Name',
    rules: [
      ValidationRules.required('Please enter your name'),
      ValidationRules.minLength(2, 'Name must be at least 2 characters'),
      ValidationRules.maxLength(50, 'Name must be less than 50 characters'),
    ],
  },
  {
    name: 'email',
    label: 'Email Address',
    rules: [
      ValidationRules.required('Please enter your email address'),
      ValidationRules.email(),
      ValidationRules.maxLength(100, 'Email must be less than 100 characters'),
    ],
  },
  {
    name: 'subject',
    label: 'Subject',
    rules: [
      ValidationRules.required('Please select a subject'),
    ],
  },
  {
    name: 'message',
    label: 'Message',
    rules: [
      ValidationRules.required('Please enter a message'),
      ValidationRules.minLength(10, 'Message must be at least 10 characters'),
      ValidationRules.maxLength(1000, 'Message must be less than 1000 characters'),
    ],
  },
  {
    name: 'privacy_consent',
    label: 'Privacy Consent',
    rules: [
      ValidationRules.required('You must agree to the Privacy Policy and Terms & Conditions'),
    ],
  },
];

/**
 * Contact form data interface
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacy_consent?: boolean;
}

/**
 * Validate contact form specifically
 */
export function validateContactForm(data: ContactFormData | FormData): ValidationResult {
  const validator = new FormValidator();
  return validator.validateForm(data, contactFormConfig);
}

/**
 * Sanitize form input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Create safe contact form data
 */
export function createSafeContactFormData(rawData: Record<string, any>): ContactFormData {
  return {
    name: sanitizeInput(rawData.name || ''),
    email: sanitizeInput(rawData.email || ''),
    subject: sanitizeInput(rawData.subject || ''),
    message: sanitizeInput(rawData.message || ''),
    privacy_consent: Boolean(rawData.privacy_consent),
  };
}
