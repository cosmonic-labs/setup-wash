import { describe, expect, test, jest } from '@jest/globals'
import { wait } from './wait.js'

describe('wait', () => {
  // Save original setTimeout
  const originalSetTimeout = global.setTimeout

  beforeEach(() => {
    // Mock setTimeout to avoid actual waiting in tests
    jest.useFakeTimers()
  })

  afterEach(() => {
    // Restore original setTimeout
    jest.useRealTimers()
    global.setTimeout = originalSetTimeout
  })

  test('resolves with "done!" after specified milliseconds', async () => {
    // Arrange
    const waitTime = 1000

    // Act
    const promise = wait(waitTime)

    // Fast-forward time
    jest.advanceTimersByTime(waitTime)

    // Assert
    await expect(promise).resolves.toBe('done!')
  })

  test('throws error if milliseconds is not a number', async () => {
    // Arrange & Act & Assert
    await expect(wait(NaN)).rejects.toThrow('milliseconds is not a number')
  })

  test('resolves after the specified time has elapsed', async () => {
    // Arrange
    const waitTime = 500

    // Act
    const startTime = Date.now()
    jest.useRealTimers() // Use real timers for this test

    // Assert
    const result = await wait(waitTime)
    const endTime = Date.now()

    expect(result).toBe('done!')
    expect(endTime - startTime).toBeGreaterThanOrEqual(waitTime - 10) // Allow small timing variations
  })
})
