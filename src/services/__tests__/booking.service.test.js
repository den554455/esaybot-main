jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../utils/errorHandler', () => ({
  errorHandler: {
    log: jest.fn(),
  },
}));

import api from '../api';
import { bookingService } from '../booking.service';

describe('bookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns validated slots on success', async () => {
    api.get.mockResolvedValue({
      data: { slots: [{ time: '10:00' }, { time: '11:00' }] },
    });

    const result = await bookingService.getSlots(1, '2026-07-10');

    expect(api.get).toHaveBeenCalledWith('/slots', {
      params: { master_id: 1, date: '2026-07-10' },
    });
    expect(result).toHaveLength(2);
  });

  it('creates an appointment and returns the validated object', async () => {
    api.post.mockResolvedValue({
      data: { id: 42, status: 'confirmed' },
    });

    const result = await bookingService.bookAppointment({
      masterId: 1,
      serviceId: 2,
      date: '2026-07-10',
      time: '10:00',
      price: 1000,
    });

    expect(api.post).toHaveBeenCalledWith('/book', {
      masterId: 1,
      serviceId: 2,
      date: '2026-07-10',
      time: '10:00',
      price: 1000,
      comment: '',
    });
    expect(result).toEqual({ id: 42, status: 'confirmed' });
  });

  it('propagates the error and logs it via the centralized error handler on booking failure', async () => {
    const { errorHandler } = require('../../utils/errorHandler');
    const error = { response: { data: { error: 'Time slot already booked' } } };
    api.post.mockRejectedValue(error);

    await expect(
      bookingService.bookAppointment({ masterId: 1, serviceId: 2, date: '2026-07-10', time: '10:00', price: 1000 })
    ).rejects.toBe(error);

    expect(errorHandler.log).toHaveBeenCalledWith(error, 'bookingService.bookAppointment');
  });

  it('cancels an appointment', async () => {
    api.post.mockResolvedValue({ data: { id: 42, status: 'cancelled' } });

    const result = await bookingService.cancelAppointment(42);

    expect(api.post).toHaveBeenCalledWith('/cancel', { appointmentId: 42 });
    expect(result).toEqual({ id: 42, status: 'cancelled' });
  });
});
