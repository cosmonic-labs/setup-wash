/**
 * Mock for @actions/tool-cache
 */
import { jest } from '@jest/globals'

// Create mock functions for all tool-cache methods used in the action
export const find = jest.fn()
export const downloadTool = jest.fn()
export const extractZip = jest.fn()
export const cacheDir = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  find.mockReset()
  downloadTool.mockReset()
  extractZip.mockReset()
  cacheDir.mockReset()
}
