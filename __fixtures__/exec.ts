/**
 * Mock for @actions/exec
 */
import { jest } from '@jest/globals'

// Create mock functions for all exec methods used in the action
export const exec = jest.fn().mockImplementation(() => Promise.resolve(0))

// Reset all mocks before each test
export function resetMocks(): void {
  exec.mockReset()
  exec.mockImplementation(() => Promise.resolve(0))
}
