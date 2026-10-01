import type { AuthProgress } from "../types/component/auth";

export const AUTH_PROGRESS_CHANGES: AuthProgress[] = [
    {
        progress: 25,
        text: "Hitelesítési adatok titkosítása és előkészítése..."
    },
    {
        progress: 50,
        text: "Biztonságos kapcsolat kiépítése a platform vaulttal..."
    },
    {
        progress: 75,
        text: "Kubernetes adminisztrátori hitelesítés ellenőrzése..."
    },
    {
        progress: 100,
        text: "Sikeres hitelesítés! Munkamenet inicializálása..."
    }
]

export const AUTH_PROGRESS_STEP_MS: number = 30

export const AUTH_ERROR_PAUSE_MS: number = 1200

export const AUTH_SUCCESS_PAUSE_MS: number = 600

export const AUTH_ERROR_INVALID_CREDENTIALS: string = "Helytelen felhasználónév vagy jelszó!"

export const AUTH_ERROR_FAILED_AT_75: string = "Hitelesítés megtagadva a biztonsági réteg által (75%)"

export const AUTH_TOKEN_KEY: string = import.meta.env.VITE_AUTH_TOKEN_KEY || "paas_auth_token"
export const AUTH_USER_KEY: string = import.meta.env.VITE_AUTH_USER_KEY || "paas_auth_user"

export const validatePasswordFormat = (password: string): { isValid: boolean; message: string } => {
    if (!password) {
        return { isValid: false, message: "" };
    }
    if (password.length < 8) {
        return { isValid: false, message: "A jelszónak legalább 8 karakter hosszúnak kell lennie!" };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Legalább egy nagybetű szükséges (A-Z)!" };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Legalább egy kisbetű szükséges (a-z)!" };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Legalább egy számjegy szükséges (0-9)!" };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { isValid: false, message: "Legalább egy speciális karakter szükséges (pl. !@#$)!" };
    }
    return { isValid: true, message: "" };
};
