const BASE_URL =
  import.meta.env.VITE_OAUTH_SERVER_URL ||
  "http://localhost:3000";

export const API_URL = BASE_URL;

export const LOGIN_URL = `${BASE_URL}/login`;

export function getLoginUrl() {
  return LOGIN_URL;
}