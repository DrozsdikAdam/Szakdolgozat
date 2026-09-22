import { Router } from "express";
import { DeploymentController } from "../controllers/deployment.controller.js";

const router = Router();
const controller = new DeploymentController();

router.get("/deployments", controller.getDeployments);
router.post("/deployments/sync", controller.syncGitOps);
router.put("/deployments/strategy", controller.updateStrategy);
router.post("/deployments/rollback", controller.rollback);

export default router;
