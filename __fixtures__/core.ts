/**
 * Mock for @actions/core
 */
import { jest } from '@jest/globals'

// Create mock functions for all core methods used in the action
export const getInput = jest.fn()
export const setFailed = jest.fn()
export const info = jest.fn()
export const addPath = jest.fn()
export const setOutput = jest.fn()
export const warning = jest.fn()
export const debug = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  getInput.mockReset()
  setFailed.mockReset()
  info.mockReset()
  addPath.mockReset()
  setOutput.mockReset()
  warning.mockReset()
  debug.mockReset()
}
