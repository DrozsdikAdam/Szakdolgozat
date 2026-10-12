// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from '../../utils/apiFetch';

describe('apiFetch utility', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('sikeres kérés esetén visszaadja a feldolgozott JSON választ', async () => {
        const mockData = { id: 1, name: 'Csapágy' };
        window.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify(mockData),
        } as unknown as Response);

        const result = await apiFetch('/api/products');

        expect(window.fetch).toHaveBeenCalledWith(
            '/api/products',
            expect.objectContaining({
                credentials: 'include',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            })
        );
        expect(result).toEqual(mockData);
    });

    it('hiba esetén kinyeri az errorData.message tartalmát és hibát dob', async () => {
        window.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ message: 'Érvénytelen kérés formátum' }),
        } as unknown as Response);

        await expect(apiFetch('/api/work-orders')).rejects.toThrow('Érvénytelen kérés formátum');
    });

    it('hiba esetén ApiError példányt dob a megfelelő status kóddal', async () => {
        window.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ message: 'Nincs elég alkatrész raktáron!' }),
        } as unknown as Response);

        try {
            await apiFetch('/api/work-orders/status');
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect((error as ApiError).status).toBe(400);
            expect((error as ApiError).message).toBe('Nincs elég alkatrész raktáron!');
        }
    });

    it('401 esetén megpróbálja a token frissítést és újrapróbálja a kérést', async () => {
        const originalMock = { id: 'wo-1', orderNumber: 'WO-001' };

        window.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => JSON.stringify({ message: 'Unauthorized' }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ success: true }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify(originalMock),
            } as unknown as Response);

        const result = await apiFetch('/api/work-orders');

        expect(window.fetch).toHaveBeenCalledTimes(3);
        expect(result).toEqual(originalMock);
    });
});
