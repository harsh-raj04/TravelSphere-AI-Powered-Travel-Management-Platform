#!/usr/bin/env bash
set -euo pipefail

# Cost-optimized dev RDS PostgreSQL provisioning script for TravelSphere.
# Creates (or reuses) default VPC resources and provisions one small instance.

REGION="${AWS_REGION:-us-east-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-travelsphere-db-dev}"
DB_NAME="${DB_NAME:-travelsphere}"
DB_USERNAME="${DB_USERNAME:-travelsphere_admin}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
DB_ENGINE_VERSION="${DB_ENGINE_VERSION:-16.3}"
DB_STORAGE_GB="${DB_STORAGE_GB:-20}"
PUBLIC_ACCESS="${PUBLIC_ACCESS:-true}"
OPEN_TO_MY_IP="${OPEN_TO_MY_IP:-true}"
SUBNET_GROUP_NAME="${SUBNET_GROUP_NAME:-travelsphere-db-subnet-group}"
SECURITY_GROUP_NAME="${SECURITY_GROUP_NAME:-travelsphere-db-sg}"

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required but not installed." >&2
  exit 1
fi

aws sts get-caller-identity >/dev/null

if [[ -z "$DB_PASSWORD" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    DB_PASSWORD="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)"
  else
    echo "Set DB_PASSWORD explicitly (openssl not found for password generation)." >&2
    exit 1
  fi
fi

echo "Using region: $REGION"

DEFAULT_VPC_ID="$(aws ec2 describe-vpcs \
  --region "$REGION" \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' \
  --output text)"

if [[ "$DEFAULT_VPC_ID" == "None" || -z "$DEFAULT_VPC_ID" ]]; then
  echo "No default VPC found in region $REGION. Create one or set subnet/security group manually." >&2
  exit 1
fi

echo "Default VPC: $DEFAULT_VPC_ID"

SUBNET_IDS="$(aws ec2 describe-subnets \
  --region "$REGION" \
  --filters Name=vpc-id,Values="$DEFAULT_VPC_ID" Name=default-for-az,Values=true \
  --query 'Subnets[].SubnetId' \
  --output text)"

if [[ -z "$SUBNET_IDS" ]]; then
  echo "No default subnets found in VPC $DEFAULT_VPC_ID." >&2
  exit 1
fi

if ! aws rds describe-db-subnet-groups \
  --region "$REGION" \
  --db-subnet-group-name "$SUBNET_GROUP_NAME" >/dev/null 2>&1; then
  echo "Creating DB subnet group: $SUBNET_GROUP_NAME"
  aws rds create-db-subnet-group \
    --region "$REGION" \
    --db-subnet-group-name "$SUBNET_GROUP_NAME" \
    --db-subnet-group-description "TravelSphere DB subnet group" \
    --subnet-ids $SUBNET_IDS >/dev/null
else
  echo "Reusing DB subnet group: $SUBNET_GROUP_NAME"
fi

SECURITY_GROUP_ID="$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters Name=group-name,Values="$SECURITY_GROUP_NAME" Name=vpc-id,Values="$DEFAULT_VPC_ID" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)"

if [[ "$SECURITY_GROUP_ID" == "None" || -z "$SECURITY_GROUP_ID" ]]; then
  echo "Creating security group: $SECURITY_GROUP_NAME"
  SECURITY_GROUP_ID="$(aws ec2 create-security-group \
    --region "$REGION" \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "TravelSphere PostgreSQL access" \
    --vpc-id "$DEFAULT_VPC_ID" \
    --query 'GroupId' \
    --output text)"
fi

echo "Using security group: $SECURITY_GROUP_ID"

if [[ "$OPEN_TO_MY_IP" == "true" ]]; then
  MY_IP="$(curl -s https://checkip.amazonaws.com | tr -d '\n')"
  CIDR="${MY_IP}/32"
  echo "Authorizing 5432 from: $CIDR"
  aws ec2 authorize-security-group-ingress \
    --region "$REGION" \
    --group-id "$SECURITY_GROUP_ID" \
    --ip-permissions "IpProtocol=tcp,FromPort=5432,ToPort=5432,IpRanges=[{CidrIp=$CIDR,Description=TravelSphere admin workstation}]" >/dev/null 2>&1 || true
fi

DB_EXISTS="$(aws rds describe-db-instances \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --query 'DBInstances[0].DBInstanceIdentifier' \
  --output text 2>/dev/null || true)"

if [[ "$DB_EXISTS" == "$DB_IDENTIFIER" ]]; then
  echo "RDS instance already exists: $DB_IDENTIFIER"
else
  echo "Creating RDS instance: $DB_IDENTIFIER"
  PUBLIC_FLAG="--publicly-accessible"
  if [[ "$PUBLIC_ACCESS" != "true" ]]; then
    PUBLIC_FLAG="--no-publicly-accessible"
  fi

  aws rds create-db-instance \
    --region "$REGION" \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --engine postgres \
    --engine-version "$DB_ENGINE_VERSION" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --allocated-storage "$DB_STORAGE_GB" \
    --storage-type gp3 \
    --db-name "$DB_NAME" \
    --master-username "$DB_USERNAME" \
    --master-user-password "$DB_PASSWORD" \
    --vpc-security-group-ids "$SECURITY_GROUP_ID" \
    --db-subnet-group-name "$SUBNET_GROUP_NAME" \
    "$PUBLIC_FLAG" \
    --backup-retention-period 1 \
    --auto-minor-version-upgrade \
    --no-multi-az \
    --storage-encrypted \
    --no-deletion-protection \
    --no-enable-performance-insights >/dev/null
fi

echo "Waiting for instance availability..."
aws rds wait db-instance-available \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER"

ENDPOINT="$(aws rds describe-db-instances \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)"
PORT="$(aws rds describe-db-instances \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)"

echo ""
echo "RDS is ready"
echo "Identifier: $DB_IDENTIFIER"
echo "Endpoint: $ENDPOINT:$PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Password: $DB_PASSWORD"
echo ""
echo "Set this in backend/.env (URL-encode password if needed):"
echo "DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$ENDPOINT:$PORT/$DB_NAME?sslmode=require"
echo ""
echo "Then run:"
echo "cd backend && npx prisma migrate deploy && npm run prisma:seed"
