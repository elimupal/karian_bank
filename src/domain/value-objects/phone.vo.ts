/**
 * Phone Value Object
 * Immutable, self-validating phone number
 */
export class Phone {
    private constructor(private readonly value: string) { }

    static create(phone: string): Phone {
        const normalized = phone.trim();

        if (!this.isValid(normalized)) {
            throw new Error('Invalid phone format. Expected format: +[country code][number]');
        }

        return new Phone(normalized);
    }

    private static isValid(phone: string): boolean {
        // E.164 format: +[country code][number]
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Phone): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
