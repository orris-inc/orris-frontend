/**
 * Error message mapping and conversion tool
 * Converts backend English error messages to user-friendly Chinese messages
 */

/**
 * Backend error message to Chinese mapping table
 */
export const errorMessages: Record<string, string> = {
  // Account related
  'account is not active': '您的账号尚未激活，请查收验证邮件',
  'account not active': '您的账号尚未激活，请查收验证邮件',
  'account is locked': '账号已被锁定，请联系客服',
  'account is disabled': '账号已被禁用，请联系客服',

  // Login related
  'invalid email or password': '邮箱或密码错误',
  'invalid credentials': '邮箱或密码错误',
  'incorrect password': '密码错误',
  'email not found': '该邮箱未注册',
  'user not found': '用户不存在',

  // Registration related
  'email already exists': '该邮箱已被注册',
  'user already exists': '该用户已存在',

  // Token related
  'invalid token': '验证链接无效或已过期',
  'token expired': '验证链接已过期，请重新申请',
  'token is invalid': '验证链接无效',
  'token not found': '验证链接无效',
  'expired token': '验证链接已过期',
  'invalid or expired token': '验证链接无效或已过期',

  // Email verification
  'email already verified': '该邮箱已经验证过了',
  'email not verified': '邮箱尚未验证',
  'verification failed': '验证失败，请重试',

  // Password reset
  'password reset failed': '密码重置失败，请重试',
  'invalid reset token': '重置链接无效或已过期',
  'reset token expired': '重置链接已过期，请重新申请',

  // OAuth related
  'oauth authentication failed': 'OAuth登录失败，请重试',
  'oauth provider error': 'OAuth服务商错误，请稍后重试',
  'invalid oauth code': 'OAuth验证码无效',

  // Permission related
  'unauthorized': '未授权，请先登录',
  'forbidden': '没有权限访问此资源',
  'access denied': '访问被拒绝',
  'insufficient permissions': '权限不足',

  // Network and server errors
  'network error': '网络连接失败，请检查网络设置',
  'timeout': '请求超时，请重试',
  'request timeout': '请求超时，请重试',
  'server error': '服务器错误，请稍后重试',
  'internal server error': '服务器内部错误，请稍后重试',
  'service unavailable': '服务暂不可用，请稍后重试',
  'bad gateway': '网关错误，请稍后重试',

  // Request related
  'bad request': '请求参数错误',
  'invalid request': '无效的请求',
  'validation error': '数据验证失败',
  'invalid input': '输入数据无效',
  'missing required fields': '缺少必填字段',

  // Resource related
  'not found': '请求的资源不存在',
  'resource not found': '资源不存在',
  'page not found': '页面不存在',

  // General errors
  'unknown error': '操作失败，请稍后重试',
  'something went wrong': '出现了一些问题，请稍后重试',
  'operation failed': '操作失败，请重试',
};

/**
 * Error message fuzzy matching patterns
 * Used to match error messages containing variables (e.g., "user with email xxx already exists")
 */
const errorPatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /user with email .* already exists/i,
    message: '该邮箱已被注册',
  },
  {
    pattern: /email .* already exists/i,
    message: '该邮箱已被注册',
  },
  {
    pattern: /user .* not found/i,
    message: '用户不存在',
  },
  {
    pattern: /email .* not found/i,
    message: '该邮箱未注册',
  },
  {
    pattern: /invalid .* format/i,
    message: '数据格式无效',
  },
  {
    pattern: /token .* (expired|invalid)/i,
    message: '验证链接无效或已过期',
  },
  {
    pattern: /password .* (weak|short|invalid)/i,
    message: '密码不符合要求',
  },
];

/**
 * Convert backend error message to Chinese
 * @param message - Original error message (usually English)
 * @returns Converted Chinese error message
 */
export function translateErrorMessage(message: string): string {
  if (!message) {
    return '操作失败，请稍后重试';
  }

  // 1. Exact match
  const lowercaseMessage = message.toLowerCase();
  const exactMatch = errorMessages[lowercaseMessage];
  if (exactMatch) {
    return exactMatch;
  }

  // 2. Partial match (contains keyword)
  for (const [key, value] of Object.entries(errorMessages)) {
    if (lowercaseMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // 3. Regular expression pattern match
  for (const { pattern, message: patternMessage } of errorPatterns) {
    if (pattern.test(message)) {
      return patternMessage;
    }
  }

  // 4. If message is already in Chinese, return directly
  if (/[\u4e00-\u9fa5]/.test(message)) {
    return message;
  }

  // 5. No match found, return general error message
  return '操作失败，请稍后重试';
}

/**
 * Extract and convert error message from error object
 * Supports multiple error object formats
 * @param error - Error object
 * @returns Chinese error message
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
      return '认证失败，请重新登录';
    }
    if (status === 403) {
      return '没有权限访问此资源';
    }
    if (status === 404) {
      return '请求的资源不存在';
    }
    if (status === 500) {
      return '服务器错误，请稍后重试';
    }
    if (status === 503) {
      return '服务暂不可用，请稍后重试';
    }

    // Network error
    if (axiosError.code === 'ECONNABORTED') {
      return '请求超时，请重试';
    }
    if (axiosError.message === 'Network Error') {
      return '网络连接失败，请检查网络设置';
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
  return '操作失败，请稍后重试';
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
    message: '操作失败，请稍后重试',
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
