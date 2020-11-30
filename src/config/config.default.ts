import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import * as path from 'path';

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1606460090632_3900';

  // add your config here
  config.middleware = [];

  config.security = {
    // 结合 cors，同时设置多个白名单
    domainWhiteList: [],
    // 禁用 csrf
    csrf: {
      enable: false,
    },
  };

  config.cors = {
    allowMethods: 'PUT,POST,DELETE,HEAD,PATCH,OPTIONS,GET',
    credentials: true,
  };

  config.sequelize = {
    dialect: 'mysql',
    database: 'testDB',
    host: 'xx.xx.xx.xx',
    port: 3306,
    username: 'username',
    password: 'password',
    timezone: '+08:00',
    // 配置规定去 model 目录下加载文件
    models: [
      path.resolve(
        __dirname,
        `../model/!(db).${process.env.NODE_ENV === 'production' ? 'js' : 'ts'}`,
      ),
    ],
    // 决定哪些会被添加在 sequelize
    modelMatch: (filename, member) => {
      // filename = area_type
      // member = factory 或者 AreaTypeModel，返回 true 才算匹配成功，则该 model 会被添加到 sequelize
      // 其实最终匹配的是 export 导出的那些对象，即 AreaTypeModel、factory，匹配成功的对象被添加到 sequelize
      return (
        filename.replace(/_/g, '').toLowerCase() ===
        member.replace(/Model$/, '').toLowerCase()
      );
    },
  };

  // 统一异常处理
  config.onerror = {
    all(err, ctx) {
      if (ctx.app.config.env === 'prod') {
        ctx.helper.response({ code: 500, msg: 'Server Internal Error' });
        return;
      }

      ctx.helper.response({ code: 500, msg: err });
    },
  };

  return config;
};
