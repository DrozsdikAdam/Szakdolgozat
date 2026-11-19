import { Router } from "express";
import { TelemetryController } from "../controllers/telemetry.controller.js";

const router = Router();
const controller = new TelemetryController();

router.get("/telemetry/overview", controller.getOverview);
router.get("/telemetry/workloads", controller.getWorkloads);
router.get("/telemetry/dashboards", controller.getDashboards);

export default router;
