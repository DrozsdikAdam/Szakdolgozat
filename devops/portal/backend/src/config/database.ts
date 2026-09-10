import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH || "./data/portal.db";

const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}


export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
});


