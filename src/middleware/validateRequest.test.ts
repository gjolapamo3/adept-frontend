import { describe, expect, it, vi } from 'vitest';
import { validate } from './validateRequest';
import {
  b2bOrderSchema,
  companyProfileSchema,
  registerUserSchema,
} from '../shared/schemas';

const createMockResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);
  return response;
};

describe('validateRequest middleware security tests', () => {
  it('rejects XSS payload in companyName with 400', async () => {
    const middleware = validate(companyProfileSchema);
    const req = {
      body: {
        companyName: "<script>alert('xss')</script>",
        registrationNumber: 'RC-2026-001',
        taxId: 'TIN-998821',
        businessAddress: '12 Industrial Way, Lagos',
      },
    };
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'fail',
        message: 'Input validation error',
      })
    );

    const body = res.json.mock.calls[0][0];
    expect(body.errors[0].field).toBe('companyName');
    expect(body.errors[0].message).toBe('Contains invalid characters');
  });

  it('rejects negative quantity for orders with 400', async () => {
    const middleware = validate(b2bOrderSchema);
    const req = {
      body: {
        productId: '507f1f77bcf86cd799439011',
        quantity: -100,
        unitPrice: 450000,
        currency: 'NGN',
        contactEmail: 'buyer@example.com',
      },
    };
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors[0].field).toBe('quantity');
    expect(body.errors[0].message).toBe('Quantity must be greater than 0');
  });

  it('rejects invalid email format with 400', async () => {
    const middleware = validate(registerUserSchema);
    const req = {
      body: {
        fullName: 'Ada Lovelace',
        email: 'user@domain',
        phone: '+2348030000000',
        password: 'StrongPass123',
      },
    };
    const res = createMockResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors[0].field).toBe('email');
    expect(body.errors[0].message).toBe('Invalid email format');
  });
});
