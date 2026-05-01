/**
 * Backwards-compatible alias for the legacy `JwtInterceptor` symbol.
 * New code must import `AuthInterceptor` directly.
 */
export { AuthInterceptor as JwtInterceptor } from './auth.interceptor';
