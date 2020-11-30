/**
 * 存放全局公共的接口定义
 */

/**
 * @description 接口响应数据格式
 */
export interface ResponseOption {
  code: 200 | 301 | 302 | 400 | 401 | 403 | 404 | 500;
  data?: any;
  msg?: string;
}
