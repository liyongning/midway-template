import { Sequelize } from 'sequelize-typescript';
import { scope, ScopeEnum, provide } from 'midway';
import { Options } from 'sequelize';

@scope(ScopeEnum.Singleton)
@provide('DB')
export class DB {
  public static sequelize: Sequelize;

  public static async initDB(config: Options) {
    DB.sequelize = new Sequelize(config);

    try {
      await DB.sequelize.authenticate();
    } catch (err) {
      err.message = `DB connection error, ${err.message}`;
      throw err;
    }
  }
}
