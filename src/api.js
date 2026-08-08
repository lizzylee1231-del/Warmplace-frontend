export const API_BASE_URL = "";

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
