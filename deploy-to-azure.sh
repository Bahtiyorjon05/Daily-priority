#!/bin/bash

# Daily Priority - Azure Deployment Script
# This script automates the deployment process to Azure

set -e  # Exit on error

echo "🚀 Daily Priority - Azure Deployment Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="daily-priority-rg"
LOCATION="eastus"
APP_NAME="daily-priority-app"
DB_SERVER_NAME="daily-priority-db"
DB_NAME="dailypriority"
DB_ADMIN="dbadmin"
APP_SERVICE_PLAN="daily-priority-plan"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

print_success "Azure CLI is installed"

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_info "Not logged in to Azure. Logging in..."
    az login
fi

print_success "Logged in to Azure"

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
print_info "Current subscription: $SUBSCRIPTION"

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Step 1: Create Resource Group
echo ""
print_info "Step 1: Creating Resource Group..."
if az group create --name $RESOURCE_GROUP --location $LOCATION > /dev/null 2>&1; then
    print_success "Resource group created: $RESOURCE_GROUP"
else
    print_info "Resource group already exists: $RESOURCE_GROUP"
fi

# Step 2: Create PostgreSQL Database
echo ""
print_info "Step 2: Creating PostgreSQL Database..."
read -sp "Enter database admin password (min 8 chars, must include uppercase, lowercase, and numbers): " DB_PASSWORD
echo ""

if az postgres flexible-server show --name $DB_SERVER_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_info "Database server already exists: $DB_SERVER_NAME"
else
    print_info "Creating PostgreSQL server (this may take a few minutes)..."
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $DB_SERVER_NAME \
        --location $LOCATION \
        --admin-user $DB_ADMIN \
        --admin-password "$DB_PASSWORD" \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --version 14 \
        --storage-size 32 \
        --yes

    print_success "PostgreSQL server created"

    # Create database
    az postgres flexible-server db create \
        --resource-group $RESOURCE_GROUP \
        --server-name $DB_SERVER_NAME \
        --database-name $DB_NAME

    print_success "Database created: $DB_NAME"

    # Configure firewall
    az postgres flexible-server firewall-rule create \
        --resource-group $RESOURCE_GROUP \
        --name $DB_SERVER_NAME \
        --rule-name AllowAzureServices \
        --start-ip-address 0.0.0.0 \
        --end-ip-address 0.0.0.0

    print_success "Firewall configured"
fi

# Step 3: Build Connection String
DATABASE_URL="postgresql://$DB_ADMIN:$DB_PASSWORD@$DB_SERVER_NAME.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"
print_success "Database connection string generated"

# Step 4: Run Database Migrations
echo ""
print_info "Step 3: Running Database Migrations..."
cd web
export DATABASE_URL="$DATABASE_URL"
npx prisma generate
npx prisma migrate deploy
print_success "Database migrations completed"
cd ..

# Step 5: Create App Service Plan
echo ""
print_info "Step 4: Creating App Service Plan..."
if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_info "App Service plan already exists: $APP_SERVICE_PLAN"
else
    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku B1 \
        --is-linux

    print_success "App Service plan created"
fi

# Step 6: Create Web App
echo ""
print_info "Step 5: Creating Web App..."
if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_info "Web app already exists: $APP_NAME"
else
    az webapp create \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --name $APP_NAME \
        --runtime "NODE:18-lts"

    print_success "Web app created"
fi

# Step 7: Generate NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
APP_URL="https://$APP_NAME.azurewebsites.net"

# Step 8: Configure Environment Variables
echo ""
print_info "Step 6: Configuring Environment Variables..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        DATABASE_URL="$DATABASE_URL" \
        NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        NEXTAUTH_URL="$APP_URL" \
        NEXT_PUBLIC_BASE_URL="$APP_URL" \
        NODE_ENV="production" \
    > /dev/null

print_success "Environment variables configured"

# Step 9: Ask for Google OAuth (Optional)
echo ""
read -p "Do you want to configure Google OAuth? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
    read -sp "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
    echo ""

    az webapp config appsettings set \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --settings \
            GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
            GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
        > /dev/null

    print_success "Google OAuth configured"
    print_info "Remember to add this redirect URI in Google Console:"
    print_info "$APP_URL/api/auth/callback/google"
fi

# Step 10: Build Application
echo ""
print_info "Step 7: Building Application..."
cd web
npm run build
print_success "Application built successfully"
cd ..

# Step 11: Create Deployment Package
echo ""
print_info "Step 8: Creating Deployment Package..."
cd web
zip -r ../deploy.zip .next node_modules package.json package-lock.json prisma public next.config.ts > /dev/null
cd ..
print_success "Deployment package created"

# Step 12: Deploy to Azure
echo ""
print_info "Step 9: Deploying to Azure (this may take a few minutes)..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy.zip \
    > /dev/null

print_success "Application deployed"

# Step 13: Configure Startup Command
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --startup-file "npm start" \
    > /dev/null

print_success "Startup command configured"

# Cleanup
rm -f deploy.zip

# Final Steps
echo ""
echo "==========================================="
print_success "Deployment Complete! 🎉"
echo "==========================================="
echo ""
print_info "Your app is now deployed at:"
echo "  $APP_URL"
echo ""
print_info "Next steps:"
echo "  1. Visit your app and test functionality"
echo "  2. Configure a custom domain (optional)"
echo "  3. Set up email SMTP settings (optional)"
echo "  4. Enable monitoring and alerts"
echo ""
print_info "To view logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
print_info "To restart the app:"
echo "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
print_success "Happy productivity! 🚀"
