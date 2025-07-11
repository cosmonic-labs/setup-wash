/**
 * Mock for path module
 */
import { jest } from '@jest/globals'

// Create mock functions for path methods
export const join = jest.fn()
export const dirname = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  join.mockReset()
  dirname.mockReset()
}
