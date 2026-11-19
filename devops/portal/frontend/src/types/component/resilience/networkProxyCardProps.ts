import type { NetworkTestRequestDto, NetworkTestResponseDto } from "../../resilience"

export interface NetworkProxyCardProps {
    isTestingProxy: boolean
    lastProxyResult: NetworkTestResponseDto | null
    onTestProxy: (request: NetworkTestRequestDto) => Promise<void>
}