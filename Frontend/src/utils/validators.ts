export const validateUsername = (username?: string): string | null => {
    const trimmedUsername = username?.trim()
    const usernameRegex = /^[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ._\s-]+$/

    if (!trimmedUsername) return "A felhasználónév mező kitöltése kötelező!"
    if (trimmedUsername.length < 3) return "A felhasználónévnek legalább 3 karakteresnek kell lennie!"
    if (trimmedUsername.length > 50) return "A felhasználónévnek maximum 50 karakteresnek kell lennie!"
    if (!usernameRegex.test(trimmedUsername)) return "A felhasználónév csak betűket és számokat tartalmazhat!"

    return null
}

export const validateEmail = (email?: string): string | null => {
    const trimmedEmail = email?.trim()
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!trimmedEmail) return "Az e-mail mező kitöltése kötelező!"
    if (!emailRegex.test(trimmedEmail)) return "Az e-mail formátuma érvénytelen!"

    return null
}

export const validatePassword = (password?: string): string | null => {
    const trimmedPassword = password?.trim()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

    if (!trimmedPassword) return "A jelszó mező kitöltése kötelező!"
    if (!passwordRegex.test(trimmedPassword)) return "A jelszónak legalább 8 karakteresnek kell lennie és tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert!"

    return null
}

export const validatePasswordConfirmation = (password?: string, passwordConfirmation?: string): string | null => {
    const trimmedPasswordConfirmation = passwordConfirmation?.trim()
    const trimmedPassword = password?.trim()

    if (!trimmedPasswordConfirmation) return "A jelszó ellenőrzése mező kitöltése kötelező!"
    if (trimmedPassword !== trimmedPasswordConfirmation) return "A jelszavak nem egyeznek!"

    return null
}

export const validatePhoneNumber = (phoneNumber?: string, required: boolean = false): string | null => {
    const trimmedPhoneNumber = phoneNumber?.trim()
    const phoneNumberRegex = /^\+?[0-9]{7,15}$/

    if (!trimmedPhoneNumber) return required ? "A telefonszám mező kitöltése kötelező!" : null;
    if (!phoneNumberRegex.test(trimmedPhoneNumber)) return "A telefonszám formátuma érvénytelen!";

    return null;
}

export const validateRequired = (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0))
        return `A ${fieldName} mező kitöltése kötelező!`

    return null
}

export const validateMinLength = (value: string | undefined, min: number, fieldName: string): string | null => {
    const trimmedValue = value?.trim()
    if (trimmedValue && trimmedValue.length < min)
        return `A ${fieldName} mezőnek legalább ${min} karakteresnek kell lennie!`

    return null
}

export const validateMaxLength = (value: string | undefined, max: number, fieldName: string): string | null => {
    const trimmedValue = value?.trim()
    if (trimmedValue && trimmedValue.length > max)
        return `A ${fieldName} mezőnek maximum ${max} karakteresnek kell lennie!`

    return null
}

export const validatePositiveNumber = (value: number, fieldName: string): string | null => {
    if (value <= 0)
        return `A ${fieldName} mezőnek pozitív számnak kell lennie!`

    return null
}

export const validatePositiveInteger = (value: number | undefined, fieldName: string): string | null => {
    if (value === undefined || value === null) return null;
    if (value <= 0 || !Number.isInteger(value))
        return `A ${fieldName} mezőnek pozitív egész számnak kell lennie!`

    return null
}

export const validateNonNegativeNumber = (value: number | undefined, fieldName: string): string | null => {
    if (value === undefined || value === null) return null;
    if (value < 0) return `A(z) ${fieldName} nem lehet negatív!`;

    return null
}