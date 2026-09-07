// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from '../../hooks/UsePermission';
import * as UseAuthModule from '../../hooks/UseAuth';

vi.mock('../../hooks/UseAuth');

describe('usePermission hook', () => {
    it('üres felhasználó esetén minden szerepkör false', () => {
        vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
            user: null,
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn(),
        });

        const { result } = renderHook(() => usePermission());

        expect(result.current.hasRole('OPERATOR')).toBe(false);
        expect(result.current.hasAnyRole(['OPERATOR', 'MANAGER'])).toBe(false);
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isOperator).toBe(false);
        expect(result.current.roles).toEqual([]);
    });

    it('OPERATOR szerepkörrel rendelkező felhasználót megfelelően azonosít', () => {
        vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
            user: {
                id: 'op-1',
                username: 'Gépkezelő',
                email: 'gep@mes.hu',
                phoneNumber: null,
                roles: ['OPERATOR'],
                active: true,
            },
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn(),
        });

        const { result } = renderHook(() => usePermission());

        expect(result.current.hasRole('OPERATOR')).toBe(true);
        expect(result.current.hasRole('MANAGER')).toBe(false);
        expect(result.current.isOperator).toBe(true);
        expect(result.current.isAdmin).toBe(false);
    });

    it('SYSTEMADMIN vagy CEO esetén isAdmin értéke true', () => {
        vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
            user: {
                id: 'admin-1',
                username: 'Rendszergazda',
                email: 'admin@mes.hu',
                phoneNumber: null,
                roles: ['SYSTEMADMIN'],
                active: true,
            },
            loading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            checkSession: vi.fn(),
        });

        const { result } = renderHook(() => usePermission());

        expect(result.current.isAdmin).toBe(true);
        expect(result.current.hasAllRoles(['SYSTEMADMIN'])).toBe(true);
        expect(result.current.hasAllRoles(['SYSTEMADMIN', 'CEO'])).toBe(false);
    });
});
