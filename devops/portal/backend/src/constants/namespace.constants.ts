import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLATFORM_ENV_PATH = path.resolve(__dirname, "../../../../platform.env");

function loadPlatformEnv(): Record<string, string> {
    if (!fs.existsSync(PLATFORM_ENV_PATH)) return {};
    try {
        const lines = fs.readFileSync(PLATFORM_ENV_PATH, "utf-8").split(/\r?\n/);
        const map: Record<string, string> = {};
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith("#") || !line.includes("=")) continue;
            const idx = line.indexOf("=");
            const k = line.slice(0, idx).trim();
            const v = line.slice(idx + 1).trim();
            map[k] = v;
            if (!process.env[k] && k !== "K8S_SERVER_HOST") {
                process.env[k] = v;
            }
        }
        return map;
    } catch {
        return {};
    }
}

const fileEnv = loadPlatformEnv();
const get = (key: string, fallback: string) => process.env[key] || fileEnv[key] || fallback;

export const DEFAULT_APP_NAMESPACE = get("APP_NAMESPACE", "app-mes");
export const DEFAULT_PLATFORM_NAMESPACE = get("PLATFORM_NAMESPACE", "platform-infra");

export const DEFAULT_APP_NAME = get("APP_NAME", get("BACKEND_IMAGE", "mes-backend"));
export const DEFAULT_FRONTEND_NAME = get("FRONTEND_NAME", get("FRONTEND_IMAGE", "mes-frontend"));
export const DEFAULT_HPA_NAME = get("HPA_NAME", `${DEFAULT_APP_NAME}-hpa`);
export const DEFAULT_VPA_NAME = get("VPA_NAME", `${DEFAULT_APP_NAME}-vpa`);

export const getManagedNamespaces = (): string[] => {
    const platformNs = get("PLATFORM_NAMESPACE", DEFAULT_PLATFORM_NAMESPACE);
    const appNs = get("APP_NAMESPACE", DEFAULT_APP_NAMESPACE);
    return Array.from(new Set([platformNs, appNs]));
};
