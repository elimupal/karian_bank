$env:MASTER_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_master"
$env:TENANT_DATABASE_URL="postgresql://pesira:mash8484@localhost:5432/bank_tenant_template"

Write-Host "Running master database migration..." -ForegroundColor Green
npx prisma migrate dev --name init --schema=./prisma/master.prisma

Write-Host "`nMaster migration complete!" -ForegroundColor Green
