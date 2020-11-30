import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import { ssoIgnorePath } from './ssoIgnorePath';

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // 中间件
  config.middleware = ['sso'];

  // sso 配置
  config.sso = {
    // 不需要走 sso 的链接
    ignorePath: ssoIgnorePath,
    // app 信息，在 upm 系统上
    appId: 111111,
    appKey: 'xxxxx',
    // sso server 配置
    ssoServer: {
      hostname: 'xx.xx.xx.xx',
      port: 80,
      prefix: '',
      version: 1.0,
    },
    // 这个配置别改，需要兼容导航头使用的 sts-koa-sso-sdk
    cookieOptions: {
      name: 'xxx',
      signed: false,
      maxAge: null,
      secret: 'xxxx',
    },
    // 需要和upm系统上配置的一致
    callback: 'xx.xx.xx.xx',
    // 主页地址
    homePage: 'xx.xxx.xxx.xx',
  };

  return config;
};
