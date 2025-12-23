/**
 * 错误消息转换工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  translateErrorMessage,
  extractErrorMessage,
  isAccountNotActiveError,
  extractRawErrorMessage,
} from '../error-messages';

describe('错误消息转换工具', () => {
  describe('translateErrorMessage', () => {
    it('应该转换精确匹配的英文错误', () => {
      expect(translateErrorMessage('account is not active')).toBe(
        '您的账号尚未激活，请查收验证邮件'
      );
      expect(translateErrorMessage('invalid email or password')).toBe('邮箱或密码错误');
      expect(translateErrorMessage('token expired')).toBe('验证链接已过期，请重新申请');
    });

    it('应该转换大小写不敏感的错误', () => {
      expect(translateErrorMessage('ACCOUNT IS NOT ACTIVE')).toBe(
        '您的账号尚未激活，请查收验证邮件'
      );
      expect(translateErrorMessage('Invalid Email Or Password')).toBe('邮箱或密码错误');
    });

    it('应该处理包含英文关键字的错误', () => {
      expect(translateErrorMessage('The account is not active, please verify')).toContain('激活');
      expect(translateErrorMessage('Error: invalid token found')).toContain('验证链接');
    });

    it('应该匹配模式化的错误消息', () => {
      expect(translateErrorMessage('user with email test@example.com already exists')).toBe(
        '该邮箱已被注册'
      );
      expect(translateErrorMessage('email john@example.com already exists')).toBe(
        '该邮箱已被注册'
      );
    });

    it('应该保持已有的中文消息不变', () => {
      expect(translateErrorMessage('这是一个中文错误消息')).toBe('这是一个中文错误消息');
    });

    it('应该为未知错误返回原始消息', () => {
      expect(translateErrorMessage('some random error that does not match')).toBe(
        'some random error that does not match'
      );
    });

    it('应该处理空字符串', () => {
      expect(translateErrorMessage('')).toBe('操作失败，请稍后重试');
    });
  });

  describe('extractErrorMessage', () => {
    it('应该从Axios错误中提取消息', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'account is not active',
            },
          },
          status: 400,
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('您的账号尚未激活，请查收验证邮件');
    });

    it('应该处理不同格式的API错误响应', () => {
      const error1 = {
        response: {
          data: {
            message: 'invalid token',
          },
          status: 400,
        },
      };
      expect(extractErrorMessage(error1)).toBe('验证链接无效或已过期');

      const error2 = {
        response: {
          data: {
            error: 'email already exists',
          },
          status: 400,
        },
      };
      expect(extractErrorMessage(error2)).toBe('该邮箱已被注册');
    });

    it('应该根据HTTP状态码返回对应消息', () => {
      expect(
        extractErrorMessage({
          response: { status: 401, data: {} },
        })
      ).toBe('认证失败，请重新登录');

      expect(
        extractErrorMessage({
          response: { status: 403, data: {} },
        })
      ).toBe('没有权限访问此资源');

      expect(
        extractErrorMessage({
          response: { status: 404, data: {} },
        })
      ).toBe('请求的资源不存在');

      expect(
        extractErrorMessage({
          response: { status: 500, data: {} },
        })
      ).toBe('服务器错误，请稍后重试');
    });

    it('应该处理网络错误', () => {
      expect(
        extractErrorMessage({
          message: 'Network Error',
        })
      ).toBe('网络连接失败，请检查网络设置');

      expect(
        extractErrorMessage({
          code: 'ECONNABORTED',
          message: 'timeout',
        })
      ).toBe('请求超时，请重试');
    });

    it('应该处理标准Error对象', () => {
      expect(extractErrorMessage(new Error('invalid credentials'))).toBe('邮箱或密码错误');
    });

    it('应该处理字符串错误', () => {
      expect(extractErrorMessage('token expired')).toBe('验证链接已过期，请重新申请');
    });

    it('应该处理未知错误格式', () => {
      expect(extractErrorMessage(null)).toBe('操作失败，请稍后重试');
      expect(extractErrorMessage(undefined)).toBe('操作失败，请稍后重试');
      expect(extractErrorMessage({})).toBe('操作失败，请稍后重试');
    });
  });

  describe('isAccountNotActiveError', () => {
    it('应该正确识别账号未激活错误', () => {
      expect(
        isAccountNotActiveError({
          response: {
            data: {
              error: {
                message: 'account is not active',
              },
            },
          },
        })
      ).toBe(true);

      expect(
        isAccountNotActiveError({
          response: {
            data: {
              message: 'Account not active',
            },
          },
        })
      ).toBe(true);
    });

    it('应该正确识别非账号未激活错误', () => {
      expect(
        isAccountNotActiveError({
          response: {
            data: {
              message: 'invalid password',
            },
          },
        })
      ).toBe(false);

      expect(isAccountNotActiveError(new Error('something else'))).toBe(false);
    });
  });

  describe('extractRawErrorMessage', () => {
    it('应该提取原始错误消息而不翻译', () => {
      const error = {
        response: {
          data: {
            error: {
              message: 'account is not active',
            },
          },
        },
      };
      expect(extractRawErrorMessage(error)).toBe('account is not active');
    });

    it('应该处理各种错误格式', () => {
      expect(extractRawErrorMessage(new Error('test error'))).toBe('test error');
      expect(extractRawErrorMessage('string error')).toBe('string error');
      expect(extractRawErrorMessage({ message: 'object error' })).toBe('object error');
    });
  });
});
