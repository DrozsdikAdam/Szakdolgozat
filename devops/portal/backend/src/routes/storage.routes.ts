import { Router } from "express";
import { StorageController } from "../controllers/storage.controller.js";

const router = Router();
const controller = new StorageController();

router.get("/overview", controller.getOverview);
router.put("/config", controller.saveConfig);
router.post("/test", controller.testConnection);

export default router;
