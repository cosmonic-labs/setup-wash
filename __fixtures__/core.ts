/**
 * Mock for @actions/core
 */
import { jest } from '@jest/globals'

// Create mock functions for all core methods used in the action
export const getInput = jest.fn()
export const setFailed = jest.fn()
export const info = jest.fn()
export const addPath = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  getInput.mockReset()
  setFailed.mockReset()
  info.mockReset()
  addPath.mockReset()
}
