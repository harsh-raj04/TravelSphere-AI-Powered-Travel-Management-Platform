# Phase 6: AWS RDS Setup (Cost-Optimized)

This guide provisions a low-cost PostgreSQL RDS instance for TravelSphere and wires it to the backend.

## Recommended Low-Cost Defaults

- Engine: PostgreSQL `16.3`
- Instance class: `db.t4g.micro`
- Storage: `20 GB gp3`
- Multi-AZ: `disabled`
- Backups: `1 day`
- Performance Insights: `disabled`
- Public accessibility: `true` for development (lock to your current IP only)

## Prerequisites

- AWS CLI authenticated to the target account
- Default VPC present in selected region
- Prisma migrations available in backend

## 1) Provision RDS

From repository root:

```bash
chmod +x scripts/aws/provision-rds-postgres.sh scripts/aws/delete-rds-postgres.sh
AWS_REGION=us-east-1 DB_IDENTIFIER=travelsphere-db-dev ./scripts/aws/provision-rds-postgres.sh
```

Optional environment overrides:

```bash
AWS_REGION=us-east-1 \
DB_IDENTIFIER=travelsphere-db-dev \
DB_NAME=travelsphere \
DB_USERNAME=travelsphere_admin \
DB_PASSWORD='YourStrongPassword123' \
DB_INSTANCE_CLASS=db.t4g.micro \
DB_ENGINE_VERSION=16.3 \
DB_STORAGE_GB=20 \
PUBLIC_ACCESS=true \
OPEN_TO_MY_IP=true \
./scripts/aws/provision-rds-postgres.sh
```

The script prints a ready-to-use `DATABASE_URL` with `sslmode=require`.

## 2) Configure Backend

Set `backend/.env`:

```bash
DATABASE_URL=postgresql://<user>:<password>@<endpoint>:5432/travelsphere?sslmode=require
```

Then apply schema and seed:

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

## 3) Validate App

- Start services with `./start-all.sh`
- Verify login and `/admin/*` pages show live data

## Cost Controls

- Stop DB when not in use:

```bash
aws rds stop-db-instance --region us-east-1 --db-instance-identifier travelsphere-db-dev
```

- Start DB again when needed:

```bash
aws rds start-db-instance --region us-east-1 --db-instance-identifier travelsphere-db-dev
```

- Remove everything to stop all charges:

```bash
AWS_REGION=us-east-1 DB_IDENTIFIER=travelsphere-db-dev ./scripts/aws/delete-rds-postgres.sh
```

## Notes

- Stopped RDS instances auto-start after 7 days.
- For production, move to private subnets, disable public access, and use a bastion/VPN.
