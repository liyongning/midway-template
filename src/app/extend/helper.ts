import { ResponseOption } from '../../interface';

module.exports = {
  // 统一应答
  response(responseArgs: ResponseOption): void {
    this.ctx.body = JSON.stringify(responseArgs);
    // 保证 http 层面不出错
    this.ctx.status = 200;
  },
};
