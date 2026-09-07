// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect } from 'vitest';
import { hasAnyRole } from '../../utils/rbac';
import type { User } from '../../types/user/User';

describe('rbac utility - hasAnyRole', () => {
    const adminUser: User = {
        id: '1',
        username: 'Admin',
        roles: ['SYSTEMADMIN'],
    };

    const operatorUser: User = {
        id: '2',
        username: 'Operator',
        roles: ['OPERATOR'],
    };

    const multiRoleUser: User = {
        id: '3',
        username: 'Supervisor',
        roles: ['MANAGER', 'TECHNICIAN'],
    };

    it('false-t ad ha a felhasználó null', () => {
        expect(hasAnyRole(null, ['SYSTEMADMIN'])).toBe(false);
    });

    it('false-t ad ha az allowedRoles üres', () => {
        expect(hasAnyRole(adminUser, [])).toBe(false);
    });

    it('true-t ad ha a felhasználónak megvan a kért szerepköre', () => {
        expect(hasAnyRole(adminUser, ['SYSTEMADMIN'])).toBe(true);
        expect(hasAnyRole(operatorUser, ['OPERATOR'])).toBe(true);
    });

    it('false-t ad ha a felhasználó nem rendelkezik a szerepkörrel', () => {
        expect(hasAnyRole(operatorUser, ['SYSTEMADMIN', 'MANAGER'])).toBe(false);
    });

    it('több szerepkörből legalább egy megléte esetén true', () => {
        expect(hasAnyRole(multiRoleUser, ['SYSTEMADMIN', 'TECHNICIAN'])).toBe(true);
        expect(hasAnyRole(multiRoleUser, ['MANAGER'])).toBe(true);
        expect(hasAnyRole(multiRoleUser, ['CEO', 'OPERATOR'])).toBe(false);
    });
});
