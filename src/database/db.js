import { Sequelize } from "sequelize";
import 'dotenv/config'

// Option 3: Passing parameters separately (other dialects)
export const connection = new Sequelize(process.env.DBNAME || 'cafeteriadb', process.env.USERNA || 'root', process.env.PASS || '', {
    host: process.env.DBHOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DBPORT || 3306
});


async function authenticateConnection() {
  try {
      await connection.authenticate();
      console.log('Connection has been established successfully.');
  } catch (error) {
      console.error('Unable to connect to the database:', error);
  }
}

authenticateConnection();
