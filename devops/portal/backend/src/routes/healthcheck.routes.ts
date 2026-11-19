import { Router } from "express";
import { HealthcheckController } from "../controllers/healthcheck.controller.js";

const router = Router();
const controller = new HealthcheckController();

router.get("/healthchecks", controller.getHealthchecks);
router.put("/healthchecks", controller.updateProbe);
router.post("/healthchecks/test", controller.testProbe);

export default router;
