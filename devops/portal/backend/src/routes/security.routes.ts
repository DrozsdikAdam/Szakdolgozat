import { Router } from "express";
import { SecurityController } from "../controllers/security.controller.js";

const router = Router();
const controller = new SecurityController();

router.get("/overview", controller.getOverview);
router.get("/vulnerabilities", controller.getVulnerabilities);
router.get("/tls", controller.getTlsCertificates);
router.get("/secrets", controller.getSecretCompliance);
router.post("/login", controller.login);
router.post("/rotate-password", controller.rotateAdminPassword);

export default router;
