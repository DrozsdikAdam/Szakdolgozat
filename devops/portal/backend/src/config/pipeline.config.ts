import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { PipelineConfig } from "../types/pipeline.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ENV_PATH = path.resolve(__dirname, "../../../ci/pipeline.env");

function parseEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {};
    return Object.fromEntries(
        fs.readFileSync(filePath, "utf-8")
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("#") && line.includes("="))
            .map(line => {
                const idx = line.indexOf("=");
                return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
            })
    );
}

export function loadPipelineConfig(): PipelineConfig {
    const localDotenv = path.resolve(__dirname, "../../.env");
    if (fs.existsSync(localDotenv)) {
        const localVars = parseEnvFile(localDotenv);
        for (const [k, v] of Object.entries(localVars)) {
            if (!process.env[k]) {
                process.env[k] = v;
            }
        }
    }

    const envPath = process.env.PIPELINE_ENV_PATH || DEFAULT_ENV_PATH;
    const fileEnv = parseEnvFile(envPath);

    const get = (key: string, fallback: string) => process.env[key] || fileEnv[key] || fallback;

    const gitRepoUrl = get("GIT_REPO_URL", "https://github.com/DrozsdikAdam/Szakdolgozat.git");
    const repoMatch = gitRepoUrl.match(/github\.com[/:]([^/]+)\/([^/\.]+)/);

    return {
        envPath,
        gitRepoUrl,
        repoOwner: repoMatch?.[1] || "DrozsdikAdam",
        repoName: repoMatch?.[2] || "Szakdolgozat",
        stagingBranch: get("STAGING_BRANCH", "develop"),
        productionBranch: get("PRODUCTION_BRANCH", "main"),
        appNamespace: get("APP_NAMESPACE", "app-mes"),
        stagingUrl: get("STAGING_URL", "http://staging.mes.localhost"),
        targetUrl: get("TARGET_URL", "http://mes.localhost"),
        defaultStrategy: (get("DEFAULT_STRATEGY", "canary").toLowerCase() === "bluegreen") ? "bluegreen" : "canary",
        githubToken: process.env.GITHUB_TOKEN || ""
    };
}

export const pipelineConfig = loadPipelineConfig();
