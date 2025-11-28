import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { ScheduleService } from '~/schedule/schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let registry: SchedulerRegistry;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ScheduleService, mockPolymeshLoggerProvider, SchedulerRegistry],
    }).compile();

    registry = module.get<SchedulerRegistry>(SchedulerRegistry);

    service = module.get<ScheduleService>(ScheduleService);

    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Run any pending timers first
    jest.runOnlyPendingTimers();

    // Clean up all intervals and timeouts from the registry before restoring real timers
    // Access internal state of SchedulerRegistry to get all registered intervals/timeouts
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const intervals = (registry as any).intervals;
      if (intervals && intervals instanceof Map) {
        const intervalIds = Array.from(intervals.keys());
        intervalIds.forEach((id: string) => {
          try {
            service.deleteInterval(id);
          } catch {
            // Ignore errors if interval doesn't exist
          }
        });
      }
    } catch {
      // Ignore errors if registry structure is different
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timeouts = (registry as any).timeouts;
      if (timeouts && timeouts instanceof Map) {
        const timeoutIds = Array.from(timeouts.keys());
        timeoutIds.forEach((id: string) => {
          try {
            service.deleteTimeout(id);
          } catch {
            // Ignore errors if timeout doesn't exist
          }
        });
      }
    } catch {
      // Ignore errors if registry structure is different
    }

    // Clear all fake timers
    jest.clearAllTimers();

    // Restore real timers
    jest.useRealTimers();

    // Close the module to clean up resources
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addInterval', () => {
    const id = 'someId';
    const cb = jest.fn();
    const time = 5000;

    afterEach(() => {
      cb.mockReset();
    });

    it('should add an interval function to the scheduler registry', () => {
      service.addInterval(id, cb, time);

      expect(registry.getInterval(id)).toBeDefined();
      expect(cb).not.toHaveBeenCalled();

      jest.advanceTimersByTime(time * 3);

      expect(cb).toHaveBeenCalledTimes(3);

      // Clean up the interval
      service.deleteInterval(id);
    });

    it('should handle any errors thrown by the callback', () => {
      const message = 'foo';
      cb.mockImplementation(() => {
        throw new Error(message);
      });

      service.addInterval(id, cb, time);

      jest.advanceTimersByTime(time);

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalledWith(
        `Error on scheduled task "${id}": ${message}`
      );

      // Clean up the interval
      service.deleteInterval(id);
    });
  });

  describe('deleteInterval', () => {
    it('should remove an interval added to the scheduler registry', () => {
      const id = 'someId';
      const cb = jest.fn();
      const time = 5000;

      service.addInterval(id, cb, time);

      expect(registry.getInterval(id)).toBeDefined();

      service.deleteInterval(id);

      expect(() => registry.getInterval(id)).toThrow(
        `No Interval was found with the given name (${id}). Check that you created one with a decorator or with the create API.`
      );
    });
  });

  describe('addTimeout', () => {
    const id = 'someId';
    const cb = jest.fn();
    const time = 5000;

    afterEach(() => {
      cb.mockReset();
    });

    it('should add a timeout function to the scheduler registry, and remove it when it has run', () => {
      service.addTimeout(id, cb, time);

      expect(registry.getTimeout(id)).toBeDefined();
      expect(cb).not.toHaveBeenCalled();

      jest.advanceTimersByTime(time * 3);

      expect(cb).toHaveBeenCalledTimes(1);

      expect(() => registry.getTimeout(id)).toThrow(
        `No Timeout was found with the given name (${id}). Check that you created one with a decorator or with the create API.`
      );
    });

    it('should handle any errors thrown by the callback', () => {
      const message = 'foo';
      cb.mockImplementation(() => {
        throw new Error(message);
      });

      service.addTimeout(id, cb, time);

      jest.advanceTimersByTime(time);

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalledWith(
        `Error on scheduled task "${id}": ${message}`
      );

      cb.mockImplementation(() => {
        throw message;
      });

      service.addTimeout(id, cb, time);

      jest.advanceTimersByTime(time);

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalledWith(
        `Error on scheduled task "${id}": ${message}`
      );

      // Timeouts are auto-deleted when they run, but clean up just in case
      try {
        service.deleteTimeout(id);
      } catch {
        // Ignore if already deleted
      }
    });
  });
});
