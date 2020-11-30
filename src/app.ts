import { DB } from './model/db';

export = (app) => {
  app.beforeStart(async () => {
    await DB.initDB(app.config.sequelize);
  });
};
