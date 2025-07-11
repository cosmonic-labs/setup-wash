/**
 * Mock for os module
 */
import { jest } from '@jest/globals'

export const platform = jest.fn()
export const arch = jest.fn()
export const homedir = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  platform.mockReset()
  arch.mockReset()
  homedir.mockReset()
}
