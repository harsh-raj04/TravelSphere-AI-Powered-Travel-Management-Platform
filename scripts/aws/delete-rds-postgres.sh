#!/usr/bin/env bash
set -euo pipefail

# Delete TravelSphere dev RDS resources to avoid ongoing cost.

REGION="${AWS_REGION:-us-east-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-travelsphere-db-dev}"
SUBNET_GROUP_NAME="${SUBNET_GROUP_NAME:-travelsphere-db-subnet-group}"
SECURITY_GROUP_NAME="${SECURITY_GROUP_NAME:-travelsphere-db-sg}"

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required but not installed." >&2
  exit 1
fi

aws sts get-caller-identity >/dev/null

echo "Deleting RDS instance (skip final snapshot for dev): $DB_IDENTIFIER"
aws rds delete-db-instance \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --skip-final-snapshot \
  --delete-automated-backups >/dev/null

echo "Waiting for instance deletion..."
aws rds wait db-instance-deleted \
  --region "$REGION" \
  --db-instance-identifier "$DB_IDENTIFIER"

echo "Deleting DB subnet group: $SUBNET_GROUP_NAME"
aws rds delete-db-subnet-group \
  --region "$REGION" \
  --db-subnet-group-name "$SUBNET_GROUP_NAME" >/dev/null 2>&1 || true

DEFAULT_VPC_ID="$(aws ec2 describe-vpcs \
  --region "$REGION" \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' \
  --output text)"

SECURITY_GROUP_ID="$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters Name=group-name,Values="$SECURITY_GROUP_NAME" Name=vpc-id,Values="$DEFAULT_VPC_ID" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || true)"

if [[ "$SECURITY_GROUP_ID" != "None" && -n "$SECURITY_GROUP_ID" ]]; then
  echo "Deleting security group: $SECURITY_GROUP_ID"
  aws ec2 delete-security-group \
    --region "$REGION" \
    --group-id "$SECURITY_GROUP_ID" >/dev/null 2>&1 || true
fi

echo "Cleanup complete."
