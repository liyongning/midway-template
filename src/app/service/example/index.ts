import { provide /*, inject*/ } from 'midway';
import { ExampleService } from './interface';
// import { ITestModel } from 'model/test'

@provide('exampleService')
export class Example implements ExampleService {
  // 注释掉的是调用 model 做数据库查询
  // @inject()
  // TestModel: ITestModel

  async getInfo(): Promise<any> {
    // return await this.TestModel.findAll()
    return await Promise.resolve().then(() => {
      return 'test service';
    });
  }
}
