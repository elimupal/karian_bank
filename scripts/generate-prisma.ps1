$env:MASTER_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_master"
$env:TENANT_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_tenant_template"

Write-Host "Generating master Prisma client..." -ForegroundColor Green
npx prisma generate --schema=./prisma/master.prisma

Write-Host "`nGenerating tenant Prisma client..." -ForegroundColor Green
npx prisma generate --schema=./prisma/tenant.prisma

Write-Host "`nPrisma clients generated successfully!" -ForegroundColor Green
