import crypto from "node:crypto";

export class PasswordUtil {
    public static hashToSha1(plainPassword: string): string {
        const hash = crypto.createHash("sha1").update(plainPassword, "utf8").digest("base64");
        return `{SHA}${hash}`;
    }

    public static hashToSha256(plainPassword: string): string {
        return crypto.createHash("sha256").update(plainPassword, "utf8").digest("hex");
    }

    public static verifyPassword(plainPassword: string, storedHash: string): boolean {
        if (!plainPassword || !storedHash) {
            return false;
        }

        const cleanStored = storedHash.trim();

        if (cleanStored.startsWith("{SHA}")) {
            const computedHash = this.hashToSha1(plainPassword);
            return this.safeCompare(computedHash, cleanStored);
        }

        if (cleanStored.length === 64) {
            const computedHash = this.hashToSha256(plainPassword);
            return this.safeCompare(computedHash, cleanStored);
        }

        return this.safeCompare(plainPassword, cleanStored);
    }

    public static validatePasswordComplexity(password: string): { valid: boolean; reason?: string } {
        if (!password || password.length < 8) {
            return { valid: false, reason: "A jelszónak legalább 8 karakter hosszúnak kell lennie!" };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, reason: "A jelszónak tartalmaznia kell legalább egy kisbetűt (a-z)!" };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, reason: "A jelszónak tartalmaznia kell legalább egy nagybetűt (A-Z)!" };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, reason: "A jelszónak tartalmaznia kell legalább egy számjegyet (0-9)!" };
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
            return { valid: false, reason: "A jelszónak tartalmaznia kell legalább egy speciális karaktert (pl. !@#$%^&*()_+-=)!" };
        }

        return { valid: true };
    }

    private static safeCompare(a: string, b: string): boolean {
        const bufA = Buffer.from(a, "utf8");
        const bufB = Buffer.from(b, "utf8");

        if (bufA.length !== bufB.length) {
            return false;
        }

        return crypto.timingSafeEqual(bufA, bufB);
    }

    public static parseHtpasswdLine(line: string): { username: string; passwordHash: string } | null {
        const trimmed = line.trim();
        const colonIndex = trimmed.indexOf(":");
        if (colonIndex === -1) {
            return null;
        }

        return {
            username: trimmed.substring(0, colonIndex).trim(),
            passwordHash: trimmed.substring(colonIndex + 1).trim()
        };
    }
}
