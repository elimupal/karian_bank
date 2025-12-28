-- Create master database for tenant metadata
CREATE DATABASE bank_master;

-- Create a template tenant database (you'll create separate DBs for each tenant)
CREATE DATABASE bank_tenant_template;

-- Optional: Create a user specifically for the banking app
-- CREATE USER bank_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE bank_master TO bank_user;
-- GRANT ALL PRIVILEGES ON DATABASE bank_tenant_template TO bank_user;
