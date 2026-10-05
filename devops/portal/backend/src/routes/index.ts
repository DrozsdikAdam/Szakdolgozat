import { Router } from "express";
import platformRoutes from "./platform.routes.js";
import k8sRoutes from "./k8s.routes.js";
import databaseRoutes from "./database.routes.js";
import backupRoutes from "./backup.routes.js";
import auditRoutes from "./audit.routes.js";
import pipelineRoutes from "./pipeline.routes.js";
import securityRoutes from "./security.routes.js";
import resilienceRoutes from "./resilience.routes.js";

const apiRouter = Router();

const routeEntries: Array<[string, Router]> = [
    ["/platform", platformRoutes],
    ["/k8s", k8sRoutes],
    ["/database", databaseRoutes],
    ["/backups", backupRoutes],
    ["/audit", auditRoutes],
    ["/pipelines", pipelineRoutes],
    ["/security", securityRoutes],
    ["/resilience", resilienceRoutes]
];

routeEntries.forEach(([path, router]) => apiRouter.use(path, router));

export default apiRouter;
