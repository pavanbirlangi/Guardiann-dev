# Database Setup Instructions

## Prerequisites
- PostgreSQL 12 or higher
- Node.js and npm installed
- AWS account (for production deployment)

## Local Development Setup

1. Install PostgreSQL dependencies:
```bash
npm install pg dotenv
```

2. Create a `.env` file in the Backend directory with the following variables:
```env
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=guardian_db
DB_PASSWORD=your_db_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AWS Configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name

# Server Configuration
PORT=5000
NODE_ENV=development
```

3. Create the database:
```sql
CREATE DATABASE guardian_db;
```

4. Run the schema:
```bash
psql -U your_db_user -d guardian_db -f schema.sql
```

## AWS RDS Setup

1. Create an RDS instance:
   - Engine: PostgreSQL
   - Version: 12 or higher
   - Instance class: db.t3.micro (for development)
   - Storage: 20 GB
   - Multi-AZ: No (for development)
   - Public access: Yes (for development)

2. Security Group:
   - Allow inbound PostgreSQL (port 5432) from your IP

3. Update the `.env` file with AWS RDS credentials:
```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your_rds_username
DB_PASSWORD=your_rds_password
DB_NAME=guardian_db
```

4. Run the schema on RDS:
```bash
psql -h your-rds-endpoint -U your_rds_username -d guardian_db -f schema.sql
```

## Database Schema Overview

The database consists of the following main tables:

1. `users` - User accounts and profiles
2. `categories` - Institution categories (Schools, Colleges, etc.)
3. `institutions` - Educational institutions
4. `institution_images` - Institution photos
5. `courses` - Courses offered by institutions
6. `infrastructure` - Institution facilities
7. `bookings` - Visit bookings
8. `reviews` - User reviews
9. `institution_types` - Institution type filters

Additional features:
- Automatic booking ID generation
- Rating calculation triggers
- Institution summary view
- Optimized indexes for common queries

## Backup and Maintenance

1. Regular backups:
```bash
pg_dump -U your_db_user -d guardian_db > backup.sql
```

2. Restore from backup:
```bash
psql -U your_db_user -d guardian_db < backup.sql
```

## Security Considerations

1. Always use environment variables for sensitive data
2. Enable SSL in production
3. Regular security updates
4. Implement connection pooling
5. Use prepared statements to prevent SQL injection

## Monitoring

1. Enable AWS CloudWatch for RDS monitoring
2. Set up alerts for:
   - High CPU usage
   - Low storage
   - Connection count
   - Error rates

## Scaling Considerations

1. Read replicas for heavy read operations
2. Connection pooling for better performance
3. Regular index maintenance
4. Query optimization 