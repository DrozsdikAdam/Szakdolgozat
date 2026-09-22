export type PodInfo = {
    name: string;
    namespace: string;
    status: string;
    ready: string;
    restarts: number;
    age: string;
    ip?: string;
}