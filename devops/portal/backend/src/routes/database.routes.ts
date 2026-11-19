import { Router } from "express";
import { DatabaseController } from "../controllers/database.controller.js";

const router = Router();
const controller = new DatabaseController();

router.get("/overview", controller.getOverview);
router.post("/test", controller.testConnection);
router.post("/scale", controller.scaleDatabase);
router.put("/config", controller.saveConfig);

router.post("/migrate", controller.startMigration);
router.get("/migration-status/:jobId", controller.getMigrationStatus);

router.post("/cutover/schedule", controller.scheduleCutover);
router.get("/cutover/status", controller.getCutoverStatus);
router.post("/cutover/cancel", controller.cancelCutover);

export default router;
