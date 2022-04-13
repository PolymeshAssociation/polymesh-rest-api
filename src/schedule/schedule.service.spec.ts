import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';

import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { ScheduleService } from '~/schedule/schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let registry: SchedulerRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleService, mockPolymeshLoggerProvider, SchedulerRegistry],
    }).compile();

    registry = module.get<SchedulerRegistry>(SchedulerRegistry);

    service = module.get<ScheduleService>(ScheduleService);

    jest.useFakeTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: addInterval', () => {
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
    });
  });

  describe('method: deleteInterval', () => {
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

  describe('method: addTimeout', () => {
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
    });
  });
});
