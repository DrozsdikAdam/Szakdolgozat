import { Router } from "express";
import { BackupController } from "../controllers/backup.controller.js";

const router = Router();
const controller = new BackupController();

router.get("/history", controller.getHistory);
router.get("/target", controller.getTarget);
router.put("/target", controller.saveTarget);
router.post("/target/test", controller.testTarget);
router.post("/trigger", controller.triggerBackup);
router.post("/restore", controller.triggerRestore);

export default router;
