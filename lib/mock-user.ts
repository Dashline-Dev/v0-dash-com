/**
 * Mock user context for development.
 * When real auth is added, replace getCurrentUser() with the actual session lookup.
 * Only this file needs to change -- all consumers import from here.
 */

export interface MockUser {
  id: string
  name: string
  avatar: string | null
}

export const MOCK_USER: MockUser = {
  id: "user_01",
  name: "Alex Demo",
  avatar: null,
}

export function getCurrentUser(): MockUser {
  return MOCK_USER
}
