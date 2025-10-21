# Daily Priority - Azure Deployment Script (PowerShell)
# This script automates the deployment process to Azure

$ErrorActionPreference = "Stop"

Write-Host "🚀 Daily Priority - Azure Deployment Script" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$RESOURCE_GROUP = "daily-priority-rg"
$LOCATION = "eastus"
$APP_NAME = "daily-priority-app"
$DB_SERVER_NAME = "daily-priority-db"
$DB_NAME = "dailypriority"
$DB_ADMIN = "dbadmin"
$APP_SERVICE_PLAN = "daily-priority-plan"

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Azure CLI is not installed. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Azure CLI is installed" -ForegroundColor Green

# Check if user is logged in
try {
    az account show | Out-Null
    Write-Host "✓ Logged in to Azure" -ForegroundColor Green
}
catch {
    Write-Host "ℹ Not logged in to Azure. Logging in..." -ForegroundColor Yellow
    az login
}

# Get current subscription
$SUBSCRIPTION = az account show --query name -o tsv
Write-Host "ℹ Current subscription: $SUBSCRIPTION" -ForegroundColor Yellow

Write-Host ""
$continue = Read-Host "Continue with deployment? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "ℹ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Step 1: Create Resource Group
Write-Host ""
Write-Host "ℹ Step 1: Creating Resource Group..." -ForegroundColor Yellow
try {
    az group create --name $RESOURCE_GROUP --location $LOCATION | Out-Null
    Write-Host "✓ Resource group created: $RESOURCE_GROUP" -ForegroundColor Green
}
catch {
    Write-Host "ℹ Resource group already exists: $RESOURCE_GROUP" -ForegroundColor Yellow
}

# Step 2: Create PostgreSQL Database
Write-Host ""
Write-Host "ℹ Step 2: Creating PostgreSQL Database..." -ForegroundColor Yellow
$DB_PASSWORD = Read-Host "Enter database admin password (min 8 chars, must include uppercase, lowercase, and numbers)" -AsSecureString
$DB_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

try {
    az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP | Out-Null
    Write-Host "ℹ Database server already exists: $DB_SERVER_NAME" -ForegroundColor Yellow
}
catch {
    Write-Host "ℹ Creating PostgreSQL server (this may take a few minutes)..." -ForegroundColor Yellow
    az postgres flexible-server create `
        --resource-group $RESOURCE_GROUP `
        --name $DB_SERVER_NAME `
        --location $LOCATION `
        --admin-user $DB_ADMIN `
        --admin-password $DB_PASSWORD_TEXT `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --version 14 `
        --storage-size 32 `
        --yes

    Write-Host "✓ PostgreSQL server created" -ForegroundColor Green

    # Create database
    az postgres flexible-server db create `
        --resource-group $RESOURCE_GROUP `
        --server-name $DB_SERVER_NAME `
        --database-name $DB_NAME

    Write-Host "✓ Database created: $DB_NAME" -ForegroundColor Green

    # Configure firewall
    az postgres flexible-server firewall-rule create `
        --resource-group $RESOURCE_GROUP `
        --name $DB_SERVER_NAME `
        --rule-name AllowAzureServices `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0

    Write-Host "✓ Firewall configured" -ForegroundColor Green
}

# Step 3: Build Connection String
$DATABASE_URL = "postgresql://$DB_ADMIN`:$DB_PASSWORD_TEXT@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME`?sslmode=require"
Write-Host "✓ Database connection string generated" -ForegroundColor Green

# Step 4: Run Database Migrations
Write-Host ""
Write-Host "ℹ Step 3: Running Database Migrations..." -ForegroundColor Yellow
Set-Location web
$env:DATABASE_URL = $DATABASE_URL
npx prisma generate
npx prisma migrate deploy
Write-Host "✓ Database migrations completed" -ForegroundColor Green
Set-Location ..

# Step 5: Create App Service Plan
Write-Host ""
Write-Host "ℹ Step 4: Creating App Service Plan..." -ForegroundColor Yellow
try {
    az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP | Out-Null
    Write-Host "ℹ App Service plan already exists: $APP_SERVICE_PLAN" -ForegroundColor Yellow
}
catch {
    az appservice plan create `
        --name $APP_SERVICE_PLAN `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --sku B1 `
        --is-linux

    Write-Host "✓ App Service plan created" -ForegroundColor Green
}

# Step 6: Create Web App
Write-Host ""
Write-Host "ℹ Step 5: Creating Web App..." -ForegroundColor Yellow
try {
    az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP | Out-Null
    Write-Host "ℹ Web app already exists: $APP_NAME" -ForegroundColor Yellow
}
catch {
    az webapp create `
        --resource-group $RESOURCE_GROUP `
        --plan $APP_SERVICE_PLAN `
        --name $APP_NAME `
        --runtime "NODE:18-lts"

    Write-Host "✓ Web app created" -ForegroundColor Green
}

# Step 7: Generate NextAuth Secret
$NEXTAUTH_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
$APP_URL = "https://$APP_NAME.azurewebsites.net"

# Step 8: Configure Environment Variables
Write-Host ""
Write-Host "ℹ Step 6: Configuring Environment Variables..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings `
        DATABASE_URL=$DATABASE_URL `
        NEXTAUTH_SECRET=$NEXTAUTH_SECRET `
        NEXTAUTH_URL=$APP_URL `
        NEXT_PUBLIC_BASE_URL=$APP_URL `
        NODE_ENV=production | Out-Null

Write-Host "✓ Environment variables configured" -ForegroundColor Green

# Step 9: Ask for Google OAuth (Optional)
Write-Host ""
$configureOAuth = Read-Host "Do you want to configure Google OAuth? (y/n)"
if ($configureOAuth -eq "y" -or $configureOAuth -eq "Y") {
    $GOOGLE_CLIENT_ID = Read-Host "Enter Google Client ID"
    $GOOGLE_CLIENT_SECRET = Read-Host "Enter Google Client Secret" -AsSecureString
    $GOOGLE_CLIENT_SECRET_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GOOGLE_CLIENT_SECRET))

    az webapp config appsettings set `
        --resource-group $RESOURCE_GROUP `
        --name $APP_NAME `
        --settings `
            GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID `
            GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET_TEXT | Out-Null

    Write-Host "✓ Google OAuth configured" -ForegroundColor Green
    Write-Host "ℹ Remember to add this redirect URI in Google Console:" -ForegroundColor Yellow
    Write-Host "  $APP_URL/api/auth/callback/google" -ForegroundColor Yellow
}

# Step 10: Build Application
Write-Host ""
Write-Host "ℹ Step 7: Building Application..." -ForegroundColor Yellow
Set-Location web
npm run build
Write-Host "✓ Application built successfully" -ForegroundColor Green
Set-Location ..

# Step 11: Create Deployment Package
Write-Host ""
Write-Host "ℹ Step 8: Creating Deployment Package..." -ForegroundColor Yellow
Compress-Archive -Path web\.next, web\node_modules, web\package.json, web\package-lock.json, web\prisma, web\public, web\next.config.ts -DestinationPath deploy.zip -Force
Write-Host "✓ Deployment package created" -ForegroundColor Green

# Step 12: Deploy to Azure
Write-Host ""
Write-Host "ℹ Step 9: Deploying to Azure (this may take a few minutes)..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --src deploy.zip | Out-Null

Write-Host "✓ Application deployed" -ForegroundColor Green

# Step 13: Configure Startup Command
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --startup-file "npm start" | Out-Null

Write-Host "✓ Startup command configured" -ForegroundColor Green

# Cleanup
Remove-Item deploy.zip -Force

# Final Steps
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✓ Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ Your app is now deployed at:" -ForegroundColor Yellow
Write-Host "  $APP_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "ℹ Next steps:" -ForegroundColor Yellow
Write-Host "  1. Visit your app and test functionality"
Write-Host "  2. Configure a custom domain (optional)"
Write-Host "  3. Set up email SMTP settings (optional)"
Write-Host "  4. Enable monitoring and alerts"
Write-Host ""
Write-Host "ℹ To view logs:" -ForegroundColor Yellow
Write-Host "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
Write-Host ""
Write-Host "ℹ To restart the app:" -ForegroundColor Yellow
Write-Host "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
Write-Host ""
Write-Host "✓ Happy productivity! 🚀" -ForegroundColor Green
