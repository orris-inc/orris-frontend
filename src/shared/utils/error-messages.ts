/**
 * 错误消息映射和转换工具
 * 将后端英文错误消息转换为用户友好的中文消息
 */

/**
 * 后端错误消息到中文的映射表
 */
export const errorMessages: Record<string, string> = {
  // 账号相关
  'account is not active': '您的账号尚未激活，请查收验证邮件',
  'account not active': '您的账号尚未激活，请查收验证邮件',
  'account is locked': '账号已被锁定，请联系客服',
  'account is disabled': '账号已被禁用，请联系客服',

  // 登录相关
  'invalid email or password': '邮箱或密码错误',
  'invalid credentials': '邮箱或密码错误',
  'incorrect password': '密码错误',
  'email not found': '该邮箱未注册',
  'user not found': '用户不存在',

  // 注册相关
  'email already exists': '该邮箱已被注册',
  'user already exists': '该用户已存在',

  // Token相关
  'invalid token': '验证链接无效或已过期',
  'token expired': '验证链接已过期，请重新申请',
  'token is invalid': '验证链接无效',
  'token not found': '验证链接无效',
  'expired token': '验证链接已过期',
  'invalid or expired token': '验证链接无效或已过期',

  // 邮箱验证
  'email already verified': '该邮箱已经验证过了',
  'email not verified': '邮箱尚未验证',
  'verification failed': '验证失败，请重试',

  // 密码重置
  'password reset failed': '密码重置失败，请重试',
  'invalid reset token': '重置链接无效或已过期',
  'reset token expired': '重置链接已过期，请重新申请',

  // OAuth相关
  'oauth authentication failed': 'OAuth登录失败，请重试',
  'oauth provider error': 'OAuth服务商错误，请稍后重试',
  'invalid oauth code': 'OAuth验证码无效',

  // 权限相关
  'unauthorized': '未授权，请先登录',
  'forbidden': '没有权限访问此资源',
  'access denied': '访问被拒绝',
  'insufficient permissions': '权限不足',

  // 网络和服务器错误
  'network error': '网络连接失败，请检查网络设置',
  'timeout': '请求超时，请重试',
  'request timeout': '请求超时，请重试',
  'server error': '服务器错误，请稍后重试',
  'internal server error': '服务器内部错误，请稍后重试',
  'service unavailable': '服务暂不可用，请稍后重试',
  'bad gateway': '网关错误，请稍后重试',

  // 请求相关
  'bad request': '请求参数错误',
  'invalid request': '无效的请求',
  'validation error': '数据验证失败',
  'invalid input': '输入数据无效',
  'missing required fields': '缺少必填字段',

  // 资源相关
  'not found': '请求的资源不存在',
  'resource not found': '资源不存在',
  'page not found': '页面不存在',

  // 通用错误
  'unknown error': '操作失败，请稍后重试',
  'something went wrong': '出现了一些问题，请稍后重试',
  'operation failed': '操作失败，请重试',
};

/**
 * 错误消息模糊匹配模式
 * 用于匹配包含变量的错误消息（如 "user with email xxx already exists"）
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
 * 将后端错误消息转换为中文
 * @param message - 原始错误消息（通常是英文）
 * @returns 转换后的中文错误消息
 */
export function translateErrorMessage(message: string): string {
  if (!message) {
    return '操作失败，请稍后重试';
  }

  // 1. 精确匹配
  const lowercaseMessage = message.toLowerCase();
  const exactMatch = errorMessages[lowercaseMessage];
  if (exactMatch) {
    return exactMatch;
  }

  // 2. 部分匹配（包含关键字）
  for (const [key, value] of Object.entries(errorMessages)) {
    if (lowercaseMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // 3. 正则模式匹配
  for (const { pattern, message: patternMessage } of errorPatterns) {
    if (pattern.test(message)) {
      return patternMessage;
    }
  }

  // 4. 如果消息已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(message)) {
    return message;
  }

  // 5. 未匹配到，返回通用错误消息
  console.warn('未翻译的错误消息:', message);
  return '操作失败，请稍后重试';
}

/**
 * 从错误对象中提取并转换错误消息
 * 支持多种错误对象格式
 * @param error - 错误对象
 * @returns 中文错误消息
 */
export function extractErrorMessage(error: any): string {
  // 1. Axios错误
  if (error?.isAxiosError || error?.response) {
    const responseData = error.response?.data;

    // 尝试从不同的字段提取错误消息
    const message =
      responseData?.error?.message ||
      responseData?.message ||
      responseData?.error ||
      error.message;

    if (message) {
      return translateErrorMessage(message);
    }

    // 根据HTTP状态码返回对应消息
    const status = error.response?.status;
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

    // 网络错误
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请重试';
    }
    if (error.message === 'Network Error') {
      return '网络连接失败，请检查网络设置';
    }
  }

  // 2. 标准Error对象
  if (error instanceof Error) {
    return translateErrorMessage(error.message);
  }

  // 3. 字符串错误
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }

  // 4. 对象错误
  if (error && typeof error === 'object') {
    const message = error.message || error.error || error.msg;
    if (message) {
      return translateErrorMessage(message);
    }
  }

  // 5. 未知错误
  console.error('未知错误格式:', error);
  return '操作失败，请稍后重试';
}

/**
 * 特殊错误处理：账号未激活
 * @param error - 错误对象
 * @returns 如果是账号未激活错误返回true，否则返回false
 */
export function isAccountNotActiveError(error: any): boolean {
  const message = extractRawErrorMessage(error);
  return /account.*not.*active/i.test(message);
}

/**
 * 提取原始错误消息（不翻译）
 * 用于日志记录和特殊错误判断
 * @param error - 错误对象
 * @returns 原始错误消息
 */
export function extractRawErrorMessage(error: any): string {
  if (error?.isAxiosError || error?.response) {
    const responseData = error.response?.data;
    return (
      responseData?.error?.message ||
      responseData?.message ||
      responseData?.error ||
      error.message ||
      ''
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    return error.message || error.error || error.msg || '';
  }

  return '';
}
