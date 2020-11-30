import { provide, controller, inject, Context, get } from 'midway';
import { ExampleService } from 'app/service/example/interface';

// 示例地址 /example?title=hah
@provide()
@controller('/example')
export class Example {
  @inject()
  ctx: Context;

  @inject('exampleService')
  exampleService: ExampleService;

  @get('/')
  async index(): Promise<void> {
    // 验证必须的参数是否传递
    this.ctx.validate({ title: { type: 'string' } }, this.ctx.request.query);
    // 调用 service 中的方法
    const tmp = await this.exampleService.getInfo();
    // http 响应
    this.ctx.helper.response({
      code: 200,
      data: { test: tmp },
      msg: 'success',
    });
  }
}
