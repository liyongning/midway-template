import { EggPlugin } from 'midway';
export default {
  static: true, // default is true
  validate: {
    enable: true,
    package: 'egg-validate',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
  },
} as EggPlugin;
