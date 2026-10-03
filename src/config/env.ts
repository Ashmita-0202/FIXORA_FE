/**
 * Environment access.
 *
 * Only VITE_-prefixed variables reach the browser. VITE_DEV_API_TARGET and
 * VITE_DEV_PORT are read by vite.config.ts at dev-server time and are never
 * bundled, despite the prefix — they hold a host:port, not a secret, but the
 * proxy keeps the API origin out of client code entirely.
 */

interface ImportMetaEnvShape {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMetaShape {
  readonly env: ImportMetaEnvShape;
}

const env = (import.meta as unknown as ImportMetaShape).env;

/**
 * Base URL for every API call. Defaults to the relative "/api" so requests stay
 * same-origin and work unchanged behind a dev proxy or a production reverse
 * proxy. Never hardcode an absolute host here.
 */
export const API_BASE_URL = env.VITE_API_BASE_URL ?? "/api";