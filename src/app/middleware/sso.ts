import * as http from 'http';
import * as jwt from 'jsonwebtoken';

interface Config {
  // 不走 sso 认证的地址列表
  ignorePath: Array<string>;
  // 系统信息
  appId: number;
  appKey: string;
  // sso server 配置信息
  ssoServer: {
    hostname: string;
    port: number;
    prefix: string;
    version: number;
  };
  cookieOptions: {
    name: string;
    signed: boolean;
    secret: string;
    maxAge: any;
  };
  // sso 的回调地址
  callback: string;
  // 系统主页地址
  homePage: string;
}

interface ValidCodePostData {
  code: string;
  appId: number;
  appKey: string;
}

interface HostInfo {
  hostname: string;
  port: number;
  prefix: string;
}

interface ResSso {
  // 0 正常 1 异常
  errno: 0 | 1;
  data?: {
    [key: string]: any;
  };
  errmsg?: string;
}

interface HttpOptions {
  hostname: string;
  port: number;
  path: string;
  method: 'GET' | 'POST';
  headers: {
    [key: string]: any;
  };
}

interface ValidTicketPostData {
  ticket: string;
  appId: number;
}

/**
 * 判断 url 是否包含在 urls 数组中，只要 url 开头能匹配，即认为包含
 * @param url string => '/test'
 * @param urls array => ['/test/hah', '/t1', ...]
 * return boolean
 */
function isUrlInclude(url = '', urls: Array<string> = []): boolean {
  if (!url || !urls.length) return false;
  for (let i = urls.length - 1; i >= 0; i--) {
    if (url.startsWith(urls[i])) return true;
  }
  return false;
}

async function httpRequest(
  options: HttpOptions,
  postData: string,
): Promise<ResSso> {
  const { hostname } = options;
  if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
    options.hostname = hostname.replace('http://', '');
  }
  // 发送请求
  return await new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', function (chunk) {
        chunks += chunk;
      });
      res.on('end', function () {
        const chunksObj: ResSso = JSON.parse(chunks);
        resolve(chunksObj);
      });
    });

    req.on('error', (e) => {
      reject({
        errno: 1,
        msg: e.message,
      });
    });

    postData.length && req.write(postData);
    req.end();
  });
}

/**
 * 去 sso server 验证 code 是否有效
 */
async function isValidCode(
  postData: ValidCodePostData,
  options: HostInfo,
): Promise<ResSso> {
  // 请求数据
  const { code, appId, appKey } = postData;
  const postDataStr = `code=${code}&app_id=${appId}&app_key=${appKey}`;

  // 请求参数
  const { hostname, port, prefix } = options;
  const reqOptions: HttpOptions = {
    hostname,
    port,
    path: `${prefix}/api/check_code`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postDataStr),
    },
  };

  // 发送请求
  return await httpRequest(reqOptions, postDataStr);
}

/**
 * 去 sso server 验证 ticket 是否有效
 */
async function isValidTicket(postData: ValidTicketPostData, options: HostInfo) {
  const { ticket, appId } = postData;
  const postDataStr = `ticket=${ticket}&app_id=${appId}`;

  const { hostname, port, prefix } = options;

  const reqOptions: HttpOptions = {
    hostname,
    port,
    path: `${prefix}/api/check_ticket`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postDataStr),
    },
  };

  // 发送请求
  return await httpRequest(reqOptions, postDataStr);
}

/**
 * 浏览器重定向
 * @param ctx koa 上下文
 * @param href 重定向地址
 */
function redirect(ctx: any, href: string): void {
  ctx.body = {
    code: 302,
    href,
  };
}

module.exports = (config: Config) => {
  return async (ctx, next) => {
    const {
      ignorePath,
      appId,
      appKey,
      ssoServer: { hostname, port, prefix, version },
      cookieOptions,
      homePage,
      callback,
    } = config;

    // ssoLogin href
    const ssoLoginHref = `${hostname}${prefix}/login?version=${version}&app_id=${appId}&jumpto=${callback}`;

    const options: HostInfo = {
      hostname,
      port,
      prefix,
    };

    if (ctx.url.indexOf('/jumpto') !== -1) {
      // 登陆页输入用户名密码，sso 认证后的回跳地址，sso 让浏览器重定向到这里
      const { query } = ctx;
      // 从 query 中获取 code 参数，然后去 sso server 验证 code 的有效性
      const postData: ValidCodePostData = {
        code: query.code,
        appId,
        appKey,
      };

      const res: ResSso = await isValidCode(postData, options);

      if (!res.errno) {
        // code 有效，从响应结果中拿到 ticket 信息，将 ticket 放入 cookie，其实这里应该再做一层加密，在 cookie 中放一个 seesionId
        const { data } = res;

        // 加密 ticket
        const val = jwt.sign(
          {
            username: data.username,
            ticket: data.ticket,
          },
          cookieOptions.secret,
        );

        ctx.cookies.set(cookieOptions.name, val, {
          signed: false,
          ...cookieOptions,
        });

        // 让浏览器重定向到首页
        redirect(ctx, homePage);
      } else {
        // code 无效，去登陆, 让浏览器重定向到 sso 的登陆页
        redirect(ctx, ssoLoginHref);
      }
      return;
    }

    if (!isUrlInclude(ctx.url, ignorePath)) {
      // 走认证流程
      const cookie = ctx.cookies.get(cookieOptions.name, {
        signed: false,
        ...cookieOptions,
      });

      if (cookie) {
        // 解密
        const { ticket } = jwt.verify(cookie, cookieOptions.secret);

        // 验证 cookie 的有效性
        const postData = {
          ticket: ticket,
          appId: appId,
        };

        const res: ResSso = await isValidTicket(postData, options);

        if (res.errno) {
          // ticket 无效，去登陆, 让浏览器重定向到 sso 的登陆页
          redirect(ctx, ssoLoginHref);
          return;
        }
      } else {
        // 没有cookie, 去登陆，让浏览器重定向到 sso 的登陆页
        redirect(ctx, ssoLoginHref);
        return;
      }
    }
    await next();
  };
};
