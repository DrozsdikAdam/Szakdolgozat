import { Router } from "express";
import { ResilienceController } from "../controllers/resilience.controller.js";

const router = Router();
const controller = new ResilienceController();

router.get("/overview", controller.getOverview);
router.post("/chaos/kill-pod", controller.triggerPodKill);
router.post("/loadtest/start", controller.startLoadTest);
router.get("/loadtest/:jobName", controller.getLoadTestDetails);
router.post("/proxy/test", controller.testNetworkProxy);

export default router;
