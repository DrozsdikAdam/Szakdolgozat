import { Router } from "express";
import platformRoutes from "./platform.routes.js";
import k8sRoutes from "./k8s.routes.js";
import backupRoutes from "./backup.routes.js";
import auditRoutes from "./audit.routes.js";
import pipelineRoutes from "./pipeline.routes.js";
import securityRoutes from "./security.routes.js";
import resilienceRoutes from "./resilience.routes.js";

const apiRouter = Router();

apiRouter.use("/platform", platformRoutes);
apiRouter.use("/k8s", k8sRoutes);
apiRouter.use("/backups", backupRoutes);
apiRouter.use("/audit", auditRoutes);
apiRouter.use("/pipelines", pipelineRoutes);
apiRouter.use("/security", securityRoutes);
apiRouter.use("/resilience", resilienceRoutes);

export default apiRouter;
