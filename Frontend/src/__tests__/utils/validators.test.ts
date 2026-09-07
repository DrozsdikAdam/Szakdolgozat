// Ez a teszt mesterséges intelligencia segítségével jön létre
import { describe, it, expect } from 'vitest';
import {
    validateUsername,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validatePhoneNumber,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validatePositiveNumber,
    validatePositiveInteger,
    validateNonNegativeNumber
} from '../../utils/validators';

describe('validators utility', () => {
    describe('validateUsername', () => {
        it('hibát ad ha üres', () => {
            expect(validateUsername('')).toBe('A felhasználónév mező kitöltése kötelező!');
            expect(validateUsername('   ')).toBe('A felhasználónév mező kitöltése kötelező!');
            expect(validateUsername(undefined)).toBe('A felhasználónév mező kitöltése kötelező!');
        });

        it('hibát ad ha 3 karakternél rövidebb', () => {
            expect(validateUsername('ab')).toBe('A felhasználónévnek legalább 3 karakteresnek kell lennie!');
        });

        it('hibát ad ha 50 karakternél hosszabb', () => {
            const longName = 'a'.repeat(51);
            expect(validateUsername(longName)).toBe('A felhasználónévnek maximum 50 karakteresnek kell lennie!');
        });

        it('hibát ad érvénytelen karakterekre', () => {
            expect(validateUsername('user<script>')).toBe('A felhasználónév csak betűket és számokat tartalmazhat!');
        });

        it('érvényes felhasználónevet elfogad', () => {
            expect(validateUsername('kovacs_bela')).toBeNull();
            expect(validateUsername('Operator-01')).toBeNull();
            expect(validateUsername('János')).toBeNull();
        });
    });

    describe('validateEmail', () => {
        it('hibát ad ha üres', () => {
            expect(validateEmail('')).toBe('Az e-mail mező kitöltése kötelező!');
            expect(validateEmail(undefined)).toBe('Az e-mail mező kitöltése kötelező!');
        });

        it('hibát ad érvénytelen formátumra', () => {
            expect(validateEmail('not-an-email')).toBe('Az e-mail formátuma érvénytelen!');
            expect(validateEmail('user@')).toBe('Az e-mail formátuma érvénytelen!');
            expect(validateEmail('@domain.com')).toBe('Az e-mail formátuma érvénytelen!');
        });

        it('érvényes emailt elfogad', () => {
            expect(validateEmail('admin@mes.hu')).toBeNull();
            expect(validateEmail('test.user+1@domain.co.uk')).toBeNull();
        });
    });

    describe('validatePassword', () => {
        it('hibát ad ha üres', () => {
            expect(validatePassword('')).toBe('A jelszó mező kitöltése kötelező!');
            expect(validatePassword(undefined)).toBe('A jelszó mező kitöltése kötelező!');
        });

        it('hibát ad ha nem teljesíti a komplexitást', () => {
            expect(validatePassword('short1!')).toBe('A jelszónak legalább 8 karakteresnek kell lennie és tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert!');
            expect(validatePassword('nouppercase1!')).toBe('A jelszónak legalább 8 karakteresnek kell lennie és tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert!');
            expect(validatePassword('NOLOWERCASE1!')).toBe('A jelszónak legalább 8 karakteresnek kell lennie és tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert!');
            expect(validatePassword('NoSpecialChar123')).toBe('A jelszónak legalább 8 karakteresnek kell lennie és tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert!');
        });

        it('érvényes erős jelszót elfogad', () => {
            expect(validatePassword('Password123!')).toBeNull();
            expect(validatePassword('Titkos@2026')).toBeNull();
        });
    });

    describe('validatePasswordConfirmation', () => {
        it('hibát ad ha az ellenőrzés üres', () => {
            expect(validatePasswordConfirmation('Password123!', '')).toBe('A jelszó ellenőrzése mező kitöltése kötelező!');
        });

        it('hibát ad ha a jelszavak nem egyeznek', () => {
            expect(validatePasswordConfirmation('Password123!', 'OtherPassword123!')).toBe('A jelszavak nem egyeznek!');
        });

        it('elfogadja ha egyeznek', () => {
            expect(validatePasswordConfirmation('Password123!', 'Password123!')).toBeNull();
        });
    });

    describe('validatePhoneNumber', () => {
        it('nem kötelező esetben üresen nullt ad', () => {
            expect(validatePhoneNumber('', false)).toBeNull();
            expect(validatePhoneNumber(undefined, false)).toBeNull();
        });

        it('kötelező esetben üresen hibát ad', () => {
            expect(validatePhoneNumber('', true)).toBe('A telefonszám mező kitöltése kötelező!');
        });

        it('hibát ad érvénytelen formátumra', () => {
            expect(validatePhoneNumber('abc12345')).toBe('A telefonszám formátuma érvénytelen!');
            expect(validatePhoneNumber('123')).toBe('A telefonszám formátuma érvénytelen!');
        });

        it('érvényes formátumot elfogad', () => {
            expect(validatePhoneNumber('+36301234567')).toBeNull();
            expect(validatePhoneNumber('06301234567')).toBeNull();
        });
    });

    describe('validateRequired & numerikus validátorok', () => {
        it('validateRequired ellenőrzi az ürességet', () => {
            expect(validateRequired('', 'Név')).toBe('A Név mező kitöltése kötelező!');
            expect(validateRequired(null, 'Termék')).toBe('A Termék mező kitöltése kötelező!');
            expect(validateRequired([], 'Lista')).toBe('A Lista mező kitöltése kötelező!');
            expect(validateRequired('Adat', 'Név')).toBeNull();
            expect(validateRequired(['elem'], 'Lista')).toBeNull();
        });

        it('validateMinLength és validateMaxLength', () => {
            expect(validateMinLength('ab', 5, 'Kód')).toBe('A Kód mezőnek legalább 5 karakteresnek kell lennie!');
            expect(validateMinLength('abcde', 5, 'Kód')).toBeNull();
            expect(validateMaxLength('abcdef', 5, 'Kód')).toBe('A Kód mezőnek maximum 5 karakteresnek kell lennie!');
            expect(validateMaxLength('abc', 5, 'Kód')).toBeNull();
        });

        it('validatePositiveNumber és validatePositiveInteger', () => {
            expect(validatePositiveNumber(0, 'Mennyiség')).toBe('A Mennyiség mezőnek pozitív számnak kell lennie!');
            expect(validatePositiveNumber(-5, 'Mennyiség')).toBe('A Mennyiség mezőnek pozitív számnak kell lennie!');
            expect(validatePositiveNumber(10, 'Mennyiség')).toBeNull();

            expect(validatePositiveInteger(2.5, 'Darab')).toBe('A Darab mezőnek pozitív egész számnak kell lennie!');
            expect(validatePositiveInteger(5, 'Darab')).toBeNull();
        });

        it('validateNonNegativeNumber', () => {
            expect(validateNonNegativeNumber(-1, 'Selejt')).toBe('A(z) Selejt nem lehet negatív!');
            expect(validateNonNegativeNumber(0, 'Selejt')).toBeNull();
            expect(validateNonNegativeNumber(10, 'Selejt')).toBeNull();
        });
    });
});
