/**
 * Central application configuration.
 *
 * All environment access happens here — the rest of the codebase imports
 * from `config` instead of reading `process.env` directly. This keeps
 * configuration validated, typed, and discoverable in one place.
 */

export interface AppConfig {
  /** Runtime environment. */
  nodeEnv: 'development' | 'production' | 'test';
  /** Whether the server is running in production mode. */
  isProduction: boolean;
  /** Pino log level. */
  logLevel: string;
}

function parseNodeEnv(value: string | undefined): AppConfig['nodeEnv'] {
  if (value === 'production' || value === 'test') return value;
  return 'development';
}

const nodeEnv = parseNodeEnv(process.env['NODE_ENV']);

export const config: AppConfig = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
};
