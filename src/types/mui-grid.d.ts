/**
 * MUI v7 Grid兼容性类型扩展
 * 允许使用旧的container和item API
 */

import '@mui/material';

declare module '@mui/material/Grid' {
  interface GridProps {
    container?: boolean;
    item?: boolean;
    xs?: boolean | number;
    sm?: boolean | number;
    md?: boolean | number;
    lg?: boolean | number;
    xl?: boolean | number;
  }
}
