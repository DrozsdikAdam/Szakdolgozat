import { Router } from "express";
import { PipelineController } from "../controllers/pipeline.controller.js";

const router = Router();
const controller = new PipelineController();

router.get("/", controller.getPipelineRuns);

router.post("/trigger", controller.triggerPipeline);

router.post("/:id/approve", controller.approvePipeline);

router.get("/gitops-drift", controller.getGitOpsDrift);

router.post("/rollout/action", controller.executeRolloutAction);

export default router;
