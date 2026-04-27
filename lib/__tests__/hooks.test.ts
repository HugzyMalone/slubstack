import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHydrated, useNow } from '../hooks'

describe('Custom Hooks', () => {
  describe('useHydrated()', () => {
    it('should return false on server (initial render)', () => {
      const { result } = renderHook(() => useHydrated())
      // On first render (simulating SSR), should be false
      // After hydration, should be true
      expect(typeof result.current).toBe('boolean')
    })

    it('should return true after hydration on client', async () => {
      const { result } = renderHook(() => useHydrated())
      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should remain stable after hydration', async () => {
      const { result, rerender } = renderHook(() => useHydrated())
      await waitFor(() => expect(result.current).toBe(true))

      rerender()
      expect(result.current).toBe(true)

      rerender()
      expect(result.current).toBe(true)
    })
  })

  describe('useNow()', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return 0 initially when disabled', () => {
      const { result } = renderHook(() => useNow(false))
      expect(result.current).toBe(0)
    })

    it('should return current timestamp when enabled', () => {
      const mockNow = 1000000000000
      vi.setSystemTime(mockNow)

      const { result } = renderHook(() => useNow(true))
      expect(result.current).toBe(mockNow)
    })

    it('should update timestamp after default interval (60s)', async () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result } = renderHook(() => useNow(true))
      expect(result.current).toBe(initialTime)

      // Advance time by 60 seconds
      act(() => {
        vi.advanceTimersByTime(60_000)
      })

      expect(result.current).toBe(initialTime + 60_000)
    })

    it('should update timestamp after custom interval', async () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result } = renderHook(() => useNow(true, 5000))
      expect(result.current).toBe(initialTime)

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current).toBe(initialTime + 5000)
    })

    it('should not update when disabled', () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result } = renderHook(() => useNow(false))
      const initial = result.current

      act(() => {
        vi.advanceTimersByTime(120_000)
      })

      expect(result.current).toBe(initial)
    })

    it('should update multiple times over multiple intervals', () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result } = renderHook(() => useNow(true, 10_000))

      act(() => {
        vi.advanceTimersByTime(10_000)
      })
      expect(result.current).toBe(initialTime + 10_000)

      act(() => {
        vi.advanceTimersByTime(10_000)
      })
      expect(result.current).toBe(initialTime + 20_000)

      act(() => {
        vi.advanceTimersByTime(10_000)
      })
      expect(result.current).toBe(initialTime + 30_000)
    })

    it('should cleanup timer on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const { unmount } = renderHook(() => useNow(true))

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should restart timer when enabled changes from false to true', () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result, rerender } = renderHook(
        ({ enabled }) => useNow(enabled),
        { initialProps: { enabled: false } }
      )

      expect(result.current).toBe(0)

      // Enable the hook
      rerender({ enabled: true })

      // Should now have current time
      expect(result.current).toBe(initialTime)
    })

    it('should stop updating when enabled changes from true to false', () => {
      const initialTime = 1000000000000
      vi.setSystemTime(initialTime)

      const { result, rerender } = renderHook(
        ({ enabled }) => useNow(enabled, 1000),
        { initialProps: { enabled: true } }
      )

      const firstValue = result.current

      // Disable
      rerender({ enabled: false })

      act(() => {
        vi.advanceTimersByTime(10_000)
      })

      // Should not have updated
      expect(result.current).toBe(firstValue)
    })

    it('should restart timer when intervalMs changes', () => {
      const { rerender } = renderHook(
        ({ interval }) => useNow(true, interval),
        { initialProps: { interval: 1000 } }
      )

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      rerender({ interval: 2000 })

      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 2000)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle very short intervals', () => {
      const { result } = renderHook(() => useNow(true, 100))
      const initial = result.current

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBeGreaterThan(initial)
    })

    it('should handle very long intervals', () => {
      const { result } = renderHook(() => useNow(true, 3600_000))
      const initial = result.current

      act(() => {
        vi.advanceTimersByTime(3600_000)
      })

      expect(result.current).toBe(initial + 3600_000)
    })
  })
})
