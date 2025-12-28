$env:MASTER_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_master"
$env:TENANT_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_tenant_template"

Write-Host "Running tenant database migration..." -ForegroundColor Green
npx prisma migrate dev --name init --schema=./prisma/tenant.prisma

Write-Host "`nTenant migration complete!" -ForegroundColor Green
