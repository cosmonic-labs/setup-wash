/**
 * Mock for fs module
 */
import { jest } from '@jest/globals'

export const mkdirSync = jest.fn()
export const existsSync = jest.fn()
export const readdirSync = jest.fn()
export const chmodSync = jest.fn()

// Reset all mocks before each test
export function resetMocks(): void {
  mkdirSync.mockReset()
  existsSync.mockReset()
  readdirSync.mockReset()
  chmodSync.mockReset()
}
