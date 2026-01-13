/**
 * Error message mapping and conversion tool
 * Uses i18n for internationalized error messages
 */

import i18n from '@/lib/i18n';

/**
 * Backend error message to i18n key mapping table
 */
const errorKeyMap: Record<string, string> = {
  // Account related
  'account is not active': 'errors.account.notActive',
  'account not active': 'errors.account.notActive',
  'account is locked': 'errors.account.locked',
  'account is disabled': 'errors.account.disabled',

  // Login related
  'invalid email or password': 'errors.login.invalidCredentials',
  'invalid credentials': 'errors.login.invalidCredentials',
  'incorrect password': 'errors.login.incorrectPassword',
  'email not found': 'errors.login.emailNotFound',
  'user not found': 'errors.login.userNotFound',

  // Registration related
  'email already exists': 'errors.register.emailExists',
  'user already exists': 'errors.register.userExists',

  // Token related
  'invalid token': 'errors.token.invalid',
  'token expired': 'errors.token.expired',
  'token is invalid': 'errors.token.invalid',
  'token not found': 'errors.token.notFound',
  'expired token': 'errors.token.expired',
  'invalid or expired token': 'errors.token.invalid',

  // Email verification
  'email already verified': 'errors.email.alreadyVerified',
  'email not verified': 'errors.email.notVerified',
  'verification failed': 'errors.email.verificationFailed',

  // Password reset
  'password reset failed': 'errors.password.resetFailed',
  'invalid reset token': 'errors.password.invalidResetToken',
  'reset token expired': 'errors.password.resetTokenExpired',

  // OAuth related
  'oauth authentication failed': 'errors.oauth.failed',
  'oauth provider error': 'errors.oauth.providerError',
  'invalid oauth code': 'errors.oauth.invalidCode',

  // Permission related
  'unauthorized': 'errors.permission.unauthorized',
  'forbidden': 'errors.permission.forbidden',
  'access denied': 'errors.permission.accessDenied',
  'insufficient permissions': 'errors.permission.insufficient',

  // Network and server errors
  'network error': 'errors.network.error',
  'timeout': 'errors.network.timeout',
  'request timeout': 'errors.network.timeout',
  'server error': 'errors.network.serverError',
  'internal server error': 'errors.network.internalError',
  'service unavailable': 'errors.network.unavailable',
  'bad gateway': 'errors.network.badGateway',

  // Request related
  'bad request': 'errors.request.badRequest',
  'invalid request': 'errors.request.invalid',
  'validation error': 'errors.request.validationError',
  'invalid input': 'errors.request.invalidInput',
  'missing required fields': 'errors.request.missingFields',

  // Resource related
  'not found': 'errors.resource.notFound',
  'resource not found': 'errors.resource.notFound',
  'page not found': 'errors.resource.pageNotFound',

  // General errors
  'unknown error': 'errors.general.unknown',
  'something went wrong': 'errors.general.somethingWrong',
  'operation failed': 'errors.general.operationFailed',
};

/**
 * Error message fuzzy matching patterns
 * Used to match error messages containing variables (e.g., "user with email xxx already exists")
 */
const errorPatterns: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /user with email .* already exists/i,
    key: 'errors.register.emailExists',
  },
  {
    pattern: /email .* already exists/i,
    key: 'errors.register.emailExists',
  },
  {
    pattern: /user .* not found/i,
    key: 'errors.login.userNotFound',
  },
  {
    pattern: /email .* not found/i,
    key: 'errors.login.emailNotFound',
  },
  {
    pattern: /invalid .* format/i,
    key: 'errors.request.invalidInput',
  },
  {
    pattern: /token .* (expired|invalid)/i,
    key: 'errors.token.invalid',
  },
  {
    pattern: /password .* (weak|short|invalid)/i,
    key: 'errors.request.validationError',
  },
];

/**
 * Translate error message using i18n
 * @param message - Original error message (usually English)
 * @returns Translated error message based on current language
 */
export function translateErrorMessage(message: string): string {
  if (!message) {
    return i18n.t('errors.general.default');
  }

  const lowercaseMessage = message.toLowerCase();

  // 1. Exact match
  const exactKey = errorKeyMap[lowercaseMessage];
  if (exactKey) {
    return i18n.t(exactKey);
  }

  // 2. Partial match (contains keyword)
  for (const [key, i18nKey] of Object.entries(errorKeyMap)) {
    if (lowercaseMessage.includes(key.toLowerCase())) {
      return i18n.t(i18nKey);
    }
  }

  // 3. Regular expression pattern match
  for (const { pattern, key } of errorPatterns) {
    if (pattern.test(message)) {
      return i18n.t(key);
    }
  }

  // 4. No match found, return original message directly
  // This ensures specific backend error messages are shown to users
  return message;
}

/**
 * Extract and translate error message from error object
 * Supports multiple error object formats
 * @param error - Error object
 * @returns Translated error message
 */
export function extractErrorMessage(error: unknown): string {
  // 1. Axios error
  if (error && typeof error === 'object' && ('isAxiosError' in error || 'response' in error)) {
    const axiosError = error as {
      isAxiosError?: boolean;
      response?: {
        data?: {
          error?: { message?: string } | string;
          message?: string;
        };
        status?: number;
      };
      code?: string;
      message?: string;
    };

    const responseData = axiosError.response?.data;

    // Try to extract error message from different fields
    let message: string | undefined;
    if (responseData && typeof responseData === 'object') {
      if ('error' in responseData) {
        message = typeof responseData.error === 'object' && responseData.error !== null && 'message' in responseData.error
          ? String(responseData.error.message)
          : typeof responseData.error === 'string'
          ? responseData.error
          : undefined;
      }
      if (!message && 'message' in responseData) {
        message = String(responseData.message);
      }
    }
    if (!message && axiosError.message) {
      message = axiosError.message;
    }

    if (message) {
      return translateErrorMessage(message);
    }

    // Return corresponding message based on HTTP status code
    const status = axiosError.response?.status;
    if (status === 401) {
      return i18n.t('errors.http.401');
    }
    if (status === 403) {
      return i18n.t('errors.http.403');
    }
    if (status === 404) {
      return i18n.t('errors.http.404');
    }
    if (status === 500) {
      return i18n.t('errors.http.500');
    }
    if (status === 503) {
      return i18n.t('errors.http.503');
    }

    // Network error
    if (axiosError.code === 'ECONNABORTED') {
      return i18n.t('errors.network.timeout');
    }
    if (axiosError.message === 'Network Error') {
      return i18n.t('errors.network.error');
    }
  }

  // 2. Standard Error object
  if (error instanceof Error) {
    return translateErrorMessage(error.message);
  }

  // 3. String error
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }

  // 4. Object error
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const message = errorObj.message || errorObj.error || errorObj.msg;
    if (message && typeof message === 'string') {
      return translateErrorMessage(message);
    }
  }

  // 5. Unknown error
  return i18n.t('errors.general.default');
}

/**
 * Special error handling: account not activated
 * @param error - Error object
 * @returns Returns true if it's an account not activated error, otherwise false
 */
export function isAccountNotActiveError(error: unknown): boolean {
  const message = extractRawErrorMessage(error);
  return /account.*not.*active/i.test(message);
}

/**
 * Auth error type enumeration
 */
export type AuthErrorType =
  | 'account_not_active'
  | 'invalid_credentials'
  | 'email_exists'
  | 'email_not_found'
  | 'invalid_token'
  | 'validation_error'
  | 'unknown';

/**
 * Field-level error structure
 */
export interface FieldErrors {
  email?: string;
  password?: string;
  name?: string;
  [key: string]: string | undefined;
}

/**
 * Structured auth error
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  fieldErrors?: FieldErrors;
  status?: number;
}

/**
 * Extract structured error from API response
 * @param error - Error object (typically AxiosError)
 * @returns Structured auth error
 */
export function extractAuthError(error: unknown): AuthError {
  const defaultError: AuthError = {
    type: 'unknown',
    message: i18n.t('errors.general.default'),
  };

  if (!error || typeof error !== 'object') {
    return defaultError;
  }

  // Check if it's an Axios error
  if (!('isAxiosError' in error || 'response' in error)) {
    if (error instanceof Error) {
      return { type: 'unknown', message: translateErrorMessage(error.message) };
    }
    return defaultError;
  }

  const axiosError = error as {
    response?: {
      data?: {
        error?: { message?: string; type?: string; details?: Record<string, string> } | string;
        message?: string;
      };
      status?: number;
    };
    message?: string;
  };

  const status = axiosError.response?.status;
  const responseData = axiosError.response?.data;

  let rawMessage = '';
  let errorType: AuthErrorType = 'unknown';
  let fieldErrors: FieldErrors | undefined;

  // Extract error message and details
  if (responseData && typeof responseData === 'object') {
    if ('error' in responseData) {
      const errorField = responseData.error;
      if (typeof errorField === 'object' && errorField !== null) {
        rawMessage = errorField.message || '';
        // Extract field-level errors from details
        if (errorField.details && typeof errorField.details === 'object') {
          fieldErrors = {};
          for (const [key, value] of Object.entries(errorField.details)) {
            if (typeof value === 'string') {
              fieldErrors[key] = translateErrorMessage(value);
            }
          }
        }
      } else if (typeof errorField === 'string') {
        rawMessage = errorField;
      }
    }
    if (!rawMessage && 'message' in responseData) {
      rawMessage = String(responseData.message);
    }
  }

  // Determine error type based on message and status
  const lowerMessage = rawMessage.toLowerCase();

  if (/account.*not.*active|account is not active/.test(lowerMessage)) {
    errorType = 'account_not_active';
  } else if (/invalid.*credentials|invalid email or password|incorrect password/.test(lowerMessage)) {
    errorType = 'invalid_credentials';
  } else if (/email.*already.*exists|user.*already.*exists/.test(lowerMessage)) {
    errorType = 'email_exists';
  } else if (/email.*not.*found|user.*not.*found/.test(lowerMessage)) {
    errorType = 'email_not_found';
  } else if (/token.*invalid|token.*expired|invalid.*token/.test(lowerMessage)) {
    errorType = 'invalid_token';
  } else if (status === 400 || /validation|invalid.*input/.test(lowerMessage)) {
    errorType = 'validation_error';
  }

  return {
    type: errorType,
    message: translateErrorMessage(rawMessage) || defaultError.message,
    fieldErrors: fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    status,
  };
}

/**
 * Check if error is a specific auth error type
 */
export function isAuthErrorType(error: unknown, type: AuthErrorType): boolean {
  return extractAuthError(error).type === type;
}

/**
 * Extract raw error message (without translation)
 * Used for logging and special error determination
 * @param error - Error object
 * @returns Raw error message
 */
export function extractRawErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && ('isAxiosError' in error || 'response' in error)) {
    const axiosError = error as {
      response?: {
        data?: {
          error?: { message?: string } | string;
          message?: string;
        };
      };
      message?: string;
    };

    const responseData = axiosError.response?.data;
    if (responseData && typeof responseData === 'object') {
      if ('error' in responseData) {
        const errorField = responseData.error;
        if (typeof errorField === 'object' && errorField !== null && 'message' in errorField) {
          return String(errorField.message);
        }
        if (typeof errorField === 'string') {
          return errorField;
        }
      }
      if ('message' in responseData && responseData.message) {
        return String(responseData.message);
      }
    }
    return axiosError.message || '';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const message = errorObj.message || errorObj.error || errorObj.msg;
    return message ? String(message) : '';
  }

  return '';
}
