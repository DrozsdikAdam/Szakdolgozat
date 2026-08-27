import type { OeeResponse, TelemertyResponse } from "../types/telemetry/Telemetry"
import { apiFetch } from "../utils/apiFetch"

const baseUrl = '/api/telemetry'

export const getLatestTelemetry = async (machineId: string): Promise<TelemertyResponse> => {
    const response = await apiFetch<TelemertyResponse>(`${baseUrl}/machine/${machineId}/latest`)
    return response;
}

export const getTelemetryHistory = async (machineId: string): Promise<TelemertyResponse[]> => {
    const response = await apiFetch<TelemertyResponse[]>(`${baseUrl}/machine/${machineId}/history`)
    return response
}

export const getMachineOee = async (machineId: string, start?: string, end?: string): Promise<OeeResponse> => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? '?' + params.toString() : '';
    const response = await apiFetch<OeeResponse>(`${baseUrl}/machine/${machineId}/oee${query}`)
    return response
}