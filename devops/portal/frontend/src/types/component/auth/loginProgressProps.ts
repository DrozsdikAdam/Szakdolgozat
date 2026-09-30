export interface LoginProgressProps {
    progress: number;
    state: 'authenticating' | 'failed' | 'success';
    stageText: string;
    errorMessage?: string;
}