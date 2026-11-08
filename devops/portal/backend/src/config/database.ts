import { Sequelize } from "sequelize";
import fs from "fs";

const isInContainer = fs.existsSync('/.dockerenv') || Boolean(process.env.KUBERNETES_SERVICE_HOST);

const host = process.env.PORTAL_DB_HOST || (isInContainer ? 'portal-db' : '127.0.0.1');
const port = Number(process.env.PORTAL_DB_PORT) || 5432;
const database = process.env.PORTAL_DB_NAME || 'portal_db';
const username = process.env.PORTAL_DB_USER || 'portal_admin';
const password = process.env.PORTAL_DB_PASSWORD || 'PortalSecurePass2026!';

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host,
    port,
    database,
    username,
    password,
    logging: false,
    pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 5
    }
});


