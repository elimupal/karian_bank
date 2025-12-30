export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    MANAGER = 'MANAGER',
    TELLER = 'TELLER',
    CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    LOCKED = 'LOCKED',
    SUSPENDED = 'SUSPENDED',
}
