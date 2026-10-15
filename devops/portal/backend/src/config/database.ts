import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.PORTAL_DB_HOST || 'portal-db',
    port: Number(process.env.PORTAL_DB_PORT) || 5432,
    database: process.env.PORTAL_DB_NAME || 'portal_db',
    username: process.env.PORTAL_DB_USER || 'portal_admin',
    password: process.env.PORTAL_DB_PASSWORD || 'PortalSecurePass2026!',
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


