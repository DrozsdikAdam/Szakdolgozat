import { Router } from "express";
import { BackupController } from "../controllers/backup.controller.js";

const router = Router();
const controller = new BackupController();

router.get("/history", controller.getHistory);
router.post("/trigger", controller.triggerBackup);
router.post("/restore", controller.triggerRestore);

export default router;
