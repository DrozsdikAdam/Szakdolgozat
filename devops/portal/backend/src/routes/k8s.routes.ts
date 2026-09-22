import { Router } from "express";
import { K8sController } from "../controllers/k8s.controller.js";
import configRoutes from "./config.routes.js";
import healthcheckRoutes from "./healthcheck.routes.js";
import deploymentRoutes from "./deployment.routes.js";
import telemetryRoutes from "./telemetry.routes.js";

const router = Router();
const controller = new K8sController();

router.get("/overview", controller.getOverview);
router.get("/ratelimit", controller.getRateLimit);
router.put("/ratelimit", controller.updateRateLimit);
router.get("/hpa", controller.getHpa);
router.put("/hpa", controller.updateHpa);
router.get("/pods/:namespace/:podName/logs", controller.getPodLogs);
router.get("/events", controller.getEvents);
router.get("/vpa", controller.getVpa);
router.put("/vpa", controller.updateVpa);

router.use("/", configRoutes);
router.use("/", healthcheckRoutes);
router.use("/", deploymentRoutes);
router.use("/", telemetryRoutes);

export default router;
