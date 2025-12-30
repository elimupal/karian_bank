/**
 * Email Value Object
 * Immutable, self-validating email representation
 */
export class Email {
    private constructor(private readonly value: string) { }

    static create(email: string): Email {
        const normalized = email.trim().toLowerCase();

        if (!this.isValid(normalized)) {
            throw new Error('Invalid email format');
        }

        return new Email(normalized);
    }

    private static isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
