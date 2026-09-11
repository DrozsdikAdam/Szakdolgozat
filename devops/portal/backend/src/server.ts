import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ConfigService } from "./services/config.service.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter);


app.use("/api", apiRouter);

app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const configService = new ConfigService();

async function startServer() {
    try {
        await configService.initDatabase();
        app.listen(PORT, () => {
            console.log(`[PaaS Portal Backend] Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("[PaaS Portal Backend] Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
