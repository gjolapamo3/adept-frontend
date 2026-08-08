import { describe, expect, it } from 'vitest';
import {
  b2bOrderSchema,
  companyProfileSchema,
  escrowReferenceSchema,
  loginUserSchema,
  orderRequestFormSchema,
  productListingSchema,
  registerUserSchema,
  updateProductStockSchema,
} from './schemas';

describe('shared schemas', () => {
  it('validates and normalizes register payload', () => {
    const parsed = registerUserSchema.parse({
      fullName: 'Ada Lovelace',
      email: ' ADA@EXAMPLE.COM ',
      phone: '+2348030000000',
      password: 'SuperSecure123',
    });

    expect(parsed.email).toBe('ada@example.com');
  });

  it('rejects invalid login email', () => {
    const result = loginUserSchema.safeParse({
      email: 'invalid-email',
      password: '12345678',
    });

    expect(result.success).toBe(false);
  });

  it('validates company onboarding payload', () => {
    const result = companyProfileSchema.safeParse({
      companyName: 'Adept Processing Ltd',
      registrationNumber: 'RC-2026-001',
      taxId: 'TIN-998821',
      businessAddress: '12 Industrial Way, Lagos',
    });

    expect(result.success).toBe(true);
  });

  it('validates product listing and coerces number fields', () => {
    const parsed = productListingSchema.parse({
      name: 'Granular Urea',
      category: 'Fertilizer',
      description: 'Bulk supply for enterprise farms',
      currency: 'ngn',
      pricePerTon: '450000',
      stock: '100',
    });

    expect(parsed.currency).toBe('NGN');
    expect(parsed.pricePerTon).toBe(450000);
  });

  it('requires order quantity and contact channel', () => {
    const result = b2bOrderSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      unitPrice: 1000,
      currency: 'NGN',
      deliveryNotes: 'Deliver in two batches',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid order payload with object id', () => {
    const result = b2bOrderSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      quantityMt: '25',
      unitPrice: '1000',
      currency: 'usd',
      contactEmail: 'buyer@example.com',
      deliveryNotes: 'Use sealed containers',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.quantityMt).toBe(25);
    }
  });

  it('coerces quantity strings to numbers in the order form schema', () => {
    const result = orderRequestFormSchema.safeParse({
      quantityMt: '20',
      contactPhone: '+2348030000000',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantityMt).toBe(20);
      expect(typeof result.data.quantityMt).toBe('number');
    }
  });

  it('rejects order form data without contact channel', () => {
    const result = orderRequestFormSchema.safeParse({
      quantityMt: '20',
      contactName: 'Buyer Team',
      deliveryNotes: 'Deliver to Lagos port',
    });

    expect(result.success).toBe(false);
  });

  it('accepts order form data with phone contact', () => {
    const result = orderRequestFormSchema.safeParse({
      quantityMt: '20',
      contactPhone: '+2348030000000',
      deliveryNotes: 'Deliver to Lagos port',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a non-empty product ID in order form data', () => {
    const result = orderRequestFormSchema.safeParse({
      productId: 'product-12345',
      quantityMt: '20',
      contactPhone: '+2348030000000',
    });

    expect(result.success).toBe(true);
  });

  it('validates escrow payment reference format', () => {
    const result = escrowReferenceSchema.safeParse({
      reference: 'ADEPT-REF-9082',
    });

    expect(result.success).toBe(true);
  });

  it('enforces stock update payload to include at least one field', () => {
    const result = updateProductStockSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
