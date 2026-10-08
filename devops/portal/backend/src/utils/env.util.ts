import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getPlatformEnvPath(): string | null {
    const envCandidates = [
        process.env.PIPELINE_ENV_PATH,
        path.resolve(__dirname, "../../../platform.env"),
        path.resolve(__dirname, "../../../../platform.env"),
        path.resolve("/app/platform.env")
    ].filter(Boolean) as string[];

    for (const p of envCandidates) {
        if (fs.existsSync(p)) return p;
    }
    return envCandidates[0] || null;
}

export function updatePlatformEnvFile(updates: Record<string, string>): void {
    const primaryEnvPath = getPlatformEnvPath();
    const envPaths = [
        primaryEnvPath,
        primaryEnvPath ? path.resolve(path.dirname(primaryEnvPath), "../.env") : null,
        path.resolve(__dirname, "../../../../../.env")
    ].filter(Boolean) as string[];

    const uniquePaths = Array.from(new Set(envPaths));

    for (const envPath of uniquePaths) {
        if (!fs.existsSync(envPath)) continue;
        try {
            let content = fs.readFileSync(envPath, "utf-8");
            for (const [key, value] of Object.entries(updates)) {
                const regex = new RegExp(`^${key}=.*$`, "m");
                if (regex.test(content)) {
                    content = content.replace(regex, `${key}=${value}`);
                } else {
                    content += (content.endsWith("\n") || content.length === 0 ? "" : "\n") + `${key}=${value}\n`;
                }
            }
            fs.writeFileSync(envPath, content, "utf-8");
        } catch (err) {
            console.warn(`[EnvUtil] Nem sikerült frissíteni az env fájlt (${envPath}):`, (err as any)?.message || err);
        }
    }
}
