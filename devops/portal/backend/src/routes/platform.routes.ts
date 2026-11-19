import { Router } from "express";
import { PlatformController } from "../controllers/platform.controller.js";

const router = Router();
const controller = new PlatformController();

router.get("/status", controller.getStatus);
router.post("/setup", controller.setup);
router.post("/features/toggle", controller.toggleFeature);

export default router;
