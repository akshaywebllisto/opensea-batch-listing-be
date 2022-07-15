'use strict';
import 'dotenv/config';
import Sequelize from 'sequelize';
// import UserModel from '../components/user/UserModel';
import OwneraModel from '../components/owner/OwnerModel';

const { MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOST, PHP_MYADMIN } = process.env;

//! Database Connection
export const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  logging: false, // false for not showing query in console
  dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  // pool: {
  //   max: 5,
  //   min: 0,
  //   acquire: 30000,
  //   idle: 10000,
  // },
});

(async () => {
  try {
    await sequelize.authenticate();
    // console.log(':>) Connection has been established successfully....!');
  } catch (error) {
    throw new Error('Unable to connect to the database:', error.message);
  }
})();

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// for Owner
db.owner = OwneraModel(sequelize, Sequelize).Owner;
db.nft = OwneraModel(sequelize, Sequelize).NFT;
db.creator = OwneraModel(sequelize, Sequelize).Creator;
db.asset_contract = OwneraModel(sequelize, Sequelize).Asset_contract;
db.collection = OwneraModel(sequelize, Sequelize).Collection;

db.asset_events = OwneraModel(sequelize, Sequelize).AssetsEvents;
db.assets = OwneraModel(sequelize, Sequelize).Assets;
db.asset_contract = OwneraModel(sequelize, Sequelize).Asset_contract;
db.collection = OwneraModel(sequelize, Sequelize).Collection;
db.seller = OwneraModel(sequelize, Sequelize).Seller;
db.winner_account = OwneraModel(sequelize, Sequelize).WinnerAccount;

db.ownerPortfolioValue = OwneraModel(sequelize, Sequelize).OwnerPortfolioValue;
db.netProfitAndLoss = OwneraModel(sequelize, Sequelize).NetProfitAndLoss;

export default db;
