import { Router } from "express";
import { ConfigController } from "../controllers/config.controller.js";

const router = Router();
const controller = new ConfigController();

// ConfigMap endpoints
router.get("/configs", controller.getConfigMaps);
router.post("/configs", controller.saveConfigMap);
router.delete("/configs/:namespace/:name", controller.deleteConfigMap);

// Secret endpoints
router.get("/secrets", controller.getSecrets);
router.get("/secrets/:namespace/:name/reveal", controller.revealSecret);
router.post("/secrets", controller.saveSecret);
router.delete("/secrets/:namespace/:name", controller.deleteSecret);

// Workload restart endpoint
router.post("/workloads/restart", controller.restartWorkload);

export default router;
