# Security Features

This document outlines the security measures implemented in the PinPinCloud application.

## Server-Side Security (Express Backend)

### 1. Rate Limiting (Anti-DDoS)

Located in `server/index.ts`:

- **Global Rate Limiter**: 100 requests per 15 minutes per IP
- **Auth Limiter**: 5 requests per 15 minutes per IP (stricter for authentication)
- **API Limiter**: 30 requests per minute per IP (for API operations)

These limits are configurable and use the `express-rate-limit` middleware to prevent distributed denial-of-service attacks.

### 2. Request Validation

- **Content-Type Validation**: Only accept JSON and URL-encoded data
- **Payload Size Limits**: 10KB maximum for request bodies
- **Input Sanitization**: Middleware checks for and blocks:
  - Prototype pollution attempts (`__proto__`, `constructor`, `prototype`)
  - String length violations (max 5000 characters)
  - Suspicious patterns

### 3. CORS Configuration

- Properly configured with `corsOrigin` environment variable
- Prevents unauthorized cross-origin requests
- Credentials support enabled for authenticated requests

## Client-Side Security

### 1. Input Validation (`client/lib/input-validation.ts`)

Provides utilities for:

- **String Sanitization**: Removes malicious characters and enforces length limits
- **Email Validation**: Ensures valid email format
- **Key Format Validation**: Validates premium key format (PINPIN-XXXX-XXXX-XXXX)
- **Firestore Query Sanitization**: Prevents injection attacks in database queries
- **User Data Validation**: Validates user object structure before storage

### 2. Firebase Injection Prevention

When writing to Firestore:

- All string inputs are sanitized before database operations
- Numeric inputs are clamped to valid ranges
- User IDs are sanitized before storage
- Key data is validated before `setDoc`/`addDoc` operations

### 3. Form Input Controls

- MaxEmojis input is clamped between 1 and 1,000,000
- Type selector restricted to valid options (monthly, yearly, lifetime)
- All form submissions include pre-validation

## Database Security

### Firestore Rules

- User authentication required for all operations
- Admin-only operations require verified admin role
- Collection-level access control for premium keys and user data

## Best Practices Implemented

1. **Principle of Least Privilege**: Users and operations limited to required permissions
2. **Input Validation on Multiple Layers**: Both client and server validate inputs
3. **Security Headers**: CORS configured to prevent unauthorized access
4. **Sensitive Data Protection**: Keys and sensitive info not logged
5. **Error Handling**: Generic error messages to prevent information disclosure

## Environment Variables

Configure these for enhanced security:

- `CORS_ORIGIN`: Specify allowed origins (e.g., `https://yourdomain.com`)
- `PING_MESSAGE`: Custom response for health checks
- Firebase credentials should be protected and not committed

## Monitoring & Logging

- Rate limit violations are logged
- Failed authentication attempts are tracked
- Invalid input attempts are recorded for security analysis

## Future Improvements

1. Implement request signing for API endpoints
2. Add WAF (Web Application Firewall) rules
3. Implement comprehensive audit logging
4. Add IP whitelisting for admin operations
5. Implement database query logging and analysis
