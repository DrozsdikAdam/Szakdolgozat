// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../../hooks/UseNetworkStatus';

vi.mock('../../services/offlineDb', () => ({
    offlineDb: {
        offlineQueue: {
            where: () => ({
                equals: () => ({
                    count: vi.fn().mockResolvedValue(2),
                }),
            }),
        },
    },
}));

describe('useNetworkStatus hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('figyeli az online és offline ablakeseményeket', async () => {
        const { result } = renderHook(() => useNetworkStatus());

        await act(async () => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current.isOnline).toBe(false);

        await act(async () => {
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current.isOnline).toBe(true);
    });

    it('betölti a várakozó offline elemek számát', async () => {
        const { result } = renderHook(() => useNetworkStatus());

        await act(async () => {
            await result.current.refreshPendingCount();
        });

        expect(result.current.pendingCount).toBe(2);
    });
});
