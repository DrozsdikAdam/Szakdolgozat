import { useState, useCallback, useMemo, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { SecurityApi } from "../client/api/security";
import {
    AUTH_PROGRESS_CHANGES,
    AUTH_PROGRESS_STEP_MS,
    AUTH_ERROR_PAUSE_MS,
    AUTH_SUCCESS_PAUSE_MS,
    AUTH_ERROR_INVALID_CREDENTIALS,
    AUTH_ERROR_FAILED_AT_75,
    validatePasswordFormat
} from "../constants/auth";
import type { AuthFlowStep, UseLoginReturn } from "../types/hook/loginHook";
import type { LoginResponse } from "../types/security";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const useLogin = (): UseLoginReturn => {
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useMemo(() => new SecurityApi(), []);

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [authStep, setAuthStep] = useState<AuthFlowStep>("FORM");
    const [progress, setProgress] = useState<number>(0);
    const [progressState, setProgressState] = useState<"authenticating" | "failed" | "success">("authenticating");
    const [stageText, setStageText] = useState<string>(AUTH_PROGRESS_CHANGES[0].text);
    const [error, setError] = useState<string | undefined>(undefined);

    const isMountedRef = useRef<boolean>(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const validation = useMemo(() => validatePasswordFormat(password), [password]);

    const isSubmitDisabled = useMemo(() => {
        return !username.trim() || !validation.isValid || authStep === "PROGRESS";
    }, [username, validation.isValid, authStep]);

    const resetForm = useCallback(() => {
        setUsername("");
        setPassword("");
        setError(undefined);
        setAuthStep("FORM");
        setProgress(0);
        setProgressState("authenticating");
    }, []);

    const handleSubmit = useCallback(
        async (e?: FormEvent) => {
            if (e) e.preventDefault();
            if (!username.trim() || !validation.isValid || authStep === "PROGRESS") {
                return;
            }

            setError(undefined);
            setAuthStep("PROGRESS");
            setProgress(0);
            setProgressState("authenticating");
            setStageText(AUTH_PROGRESS_CHANGES[0].text);

            const loginPromise: Promise<LoginResponse> = api
                .login({ username: username.trim(), password })
                .catch(() => ({
                    success: false,
                    username: username.trim(),
                    token: undefined,
                    message: AUTH_ERROR_INVALID_CREDENTIALS
                }));

            let currentProgress = 0;
            const targetPause = 75;

            while (currentProgress < targetPause) {
                if (!isMountedRef.current) return;
                await sleep(AUTH_PROGRESS_STEP_MS);
                currentProgress += 1;
                setProgress(currentProgress);

                if (currentProgress === 25) {
                    setStageText(AUTH_PROGRESS_CHANGES[0].text);
                } else if (currentProgress === 50) {
                    setStageText(AUTH_PROGRESS_CHANGES[1].text);
                } else if (currentProgress === 75) {
                    setStageText(AUTH_PROGRESS_CHANGES[2].text);
                }
            }

            const result = await loginPromise;

            if (!result.success) {
                setProgressState("failed");
                setStageText(AUTH_ERROR_FAILED_AT_75);

                await sleep(AUTH_ERROR_PAUSE_MS);
                if (!isMountedRef.current) return;

                setError(result.message || AUTH_ERROR_INVALID_CREDENTIALS);
                setAuthStep("FORM");
                setProgress(0);
                return;
            }

            setStageText(AUTH_PROGRESS_CHANGES[3].text);
            while (currentProgress < 100) {
                if (!isMountedRef.current) return;
                await sleep(AUTH_PROGRESS_STEP_MS);
                currentProgress += 1;
                setProgress(currentProgress);
            }

            setProgressState("success");
            await sleep(AUTH_SUCCESS_PAUSE_MS);
            if (!isMountedRef.current) return;

            auth.setSession(result.username || username.trim(), result.token || "session-token");
            navigate("/");
        },
        [username, password, validation.isValid, authStep, api, auth, navigate]
    );

    return {
        username,
        setUsername,
        password,
        setPassword,
        authStep,
        progress,
        progressState,
        stageText,
        error,
        isPasswordValid: validation.isValid,
        validationMessage: validation.message,
        isSubmitDisabled,
        handleSubmit,
        resetForm
    };
};
