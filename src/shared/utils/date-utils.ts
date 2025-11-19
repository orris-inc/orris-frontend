/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间为本地字符串
 * @param dateString ISO 8601 格式的日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '-';
  }
};

/**
 * 格式化日期为本地字符串（不含时间）
 * @param dateString ISO 8601 格式的日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * 格式化相对时间（如：3分钟前、2小时前）
 * @param dateString ISO 8601 格式的日期字符串
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;

    return formatDate(dateString);
  } catch {
    return '-';
  }
};
