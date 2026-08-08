import { z } from 'zod';

const VALID_TEXT = /^[a-zA-Z0-9\s&.,'-]+$/;
const VALID_NAME = /^[a-zA-Z\s'-]+$/;
const VALID_PHONE_E164 = /^\+?[1-9]\d{1,14}$/;
const VALID_ALNUM_HYPHEN = /^[a-zA-Z0-9-]+$/;
const VALID_REFERENCE = /^[A-Z0-9-]{6,40}$/i;
const VALID_CURRENCY = /^[A-Z]{3}$/;
const VALID_OBJECT_ID = /^[a-f\d]{24}$/i;

const toTrimmed = (value: string) => value.trim();

// Shared text sanitizer for common business-facing fields.
export const sanitizedString = (min = 1, max = 100) =>
  z
    .string()
    .transform(toTrimmed)
    .pipe(
      z
        .string()
        .min(min, `Must be at least ${min} characters`)
        .max(max, `Cannot exceed ${max} characters`)
        .regex(VALID_TEXT, 'Contains invalid characters')
    );

export const registerUserSchema = z
  .object({
    fullName: z
      .string()
      .transform(toTrimmed)
      .pipe(
        z
          .string()
          .min(2, 'Full name must be at least 2 characters')
          .max(100, 'Full name cannot exceed 100 characters')
          .regex(VALID_NAME, 'Invalid name format')
      ),
    email: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().email('Invalid email format'))
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().regex(VALID_PHONE_E164, 'Invalid phone format (E.164)')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters'),
  })
  .strict();

export const loginUserSchema = z
  .object({
    email: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().email('Invalid email format'))
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export const companyProfileSchema = z
  .object({
    companyName: sanitizedString(2, 100),
    registrationNumber: z
      .string()
      .transform(toTrimmed)
      .pipe(
        z
          .string()
          .min(5, 'Registration number must be at least 5 characters')
          .max(30, 'Registration number cannot exceed 30 characters')
          .regex(VALID_ALNUM_HYPHEN, 'Registration number must be alphanumeric')
      ),
    taxId: z
      .string()
      .transform(toTrimmed)
      .pipe(
        z
          .string()
          .min(5, 'Tax ID must be at least 5 characters')
          .max(30, 'Tax ID cannot exceed 30 characters')
          .regex(VALID_ALNUM_HYPHEN, 'Invalid Tax ID format')
      ),
    businessAddress: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().min(5, 'Address is too short').max(200, 'Address is too long')),
  })
  .strict();

export const productListingSchema = z
  .object({
    name: sanitizedString(2, 120).optional(),
    title: sanitizedString(2, 120).optional(),
    category: sanitizedString(2, 60),
    grade: sanitizedString(2, 60).optional(),
    purity: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().min(1, 'Purity is required').max(20, 'Purity is too long'))
      .optional(),
    description: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().min(5, 'Description is too short').max(500, 'Description is too long')),
    currency: z
      .string()
      .transform(toTrimmed)
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(VALID_CURRENCY, 'Currency must be a 3-letter ISO code'))
      .optional(),
    pricePerTon: z.coerce.number().positive('Price must be greater than 0'),
    unitPrice: z.coerce.number().positive('Price must be greater than 0').optional(),
    stock: z.coerce.number().nonnegative('Stock cannot be negative').optional(),
    availableTonnage: z.coerce
      .number()
      .nonnegative('Available tonnage cannot be negative')
      .optional(),
    packaging: sanitizedString(2, 60).optional(),
    originLocation: sanitizedString(2, 120).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.name && !value.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either name or title is required',
        path: ['name'],
      });
    }

    if (value.pricePerTon <= 0 && (!value.unitPrice || value.unitPrice <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A valid price is required',
        path: ['pricePerTon'],
      });
    }
  });

export const b2bOrderSchema = z
  .object({
    productId: z
      .string()
      .transform(toTrimmed)
      .pipe(
        z.string().refine(
          (value) => z.uuid().safeParse(value).success || VALID_OBJECT_ID.test(value),
          'Invalid product ID format'
        )
      ),
    productName: sanitizedString(2, 120).optional(),
    quantity: z.coerce
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be greater than 0')
      .optional(),
    quantityMt: z.coerce
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be greater than 0')
      .optional(),
    unitPrice: z.coerce.number().positive('Price must be greater than 0'),
    currency: z
      .string()
      .transform(toTrimmed)
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(VALID_CURRENCY, 'Currency must be a 3-letter ISO code'))
      .default('NGN'),
    contactName: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().max(100, 'Contact name cannot exceed 100 characters'))
      .optional(),
    contactEmail: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().email('Invalid email format'))
      .transform((value) => value.toLowerCase())
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().regex(VALID_PHONE_E164, 'Invalid phone format (E.164)'))
      .optional()
      .or(z.literal('')),
    deliveryNotes: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().max(500, 'Notes cannot exceed 500 characters'))
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const quantity = value.quantity ?? value.quantityMt;
    if (!quantity || quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either quantity or quantityMt must be provided',
        path: ['quantity'],
      });
    }

    const hasEmail = Boolean(value.contactEmail && value.contactEmail.trim());
    const hasPhone = Boolean(value.contactPhone && value.contactPhone.trim());
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either a contact email or phone number',
        path: ['contactEmail'],
      });
    }
  });

export const orderRequestFormSchema = z
  .object({
    quantityMt: z.coerce
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be greater than 0'),
    contactName: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().max(100, 'Contact name cannot exceed 100 characters'))
      .optional(),
    contactEmail: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().email('Invalid email format'))
      .transform((value) => value.toLowerCase())
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().regex(VALID_PHONE_E164, 'Invalid phone format (E.164)'))
      .optional()
      .or(z.literal('')),
    deliveryNotes: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().max(500, 'Notes cannot exceed 500 characters'))
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasEmail = Boolean(value.contactEmail && value.contactEmail.trim());
    const hasPhone = Boolean(value.contactPhone && value.contactPhone.trim());
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either a contact email or phone number',
        path: ['contactEmail'],
      });
    }
  });

export const shipmentTrackingSchema = z
  .object({
    orderId: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().regex(VALID_REFERENCE, 'Invalid order reference format')),
    item: sanitizedString(2, 120),
    quantity: z.coerce.number().positive('Quantity must be greater than 0'),
    total: z.coerce.number().nonnegative('Total cannot be negative'),
    supplier: sanitizedString(2, 120),
    status: z.string().transform((value) => value.trim().toUpperCase()).optional(),
  })
  .strict();

export const escrowReferenceSchema = z
  .object({
    reference: z
      .string()
      .transform(toTrimmed)
      .pipe(z.string().regex(VALID_REFERENCE, 'Invalid payment reference format')),
  })
  .strict();

export const updateProductStockSchema = z
  .object({
    stock: z.coerce.number().nonnegative('Stock cannot be negative').optional(),
    pricePerTon: z.coerce.number().positive('Price must be greater than 0').optional(),
  })
  .strict()
  .refine((value) => value.stock !== undefined || value.pricePerTon !== undefined, {
    message: 'Provide stock or pricePerTon for update',
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type ProductListingInput = z.infer<typeof productListingSchema>;
export type B2BOrderInput = z.infer<typeof b2bOrderSchema>;
export type OrderRequestFormInput = z.infer<typeof orderRequestFormSchema>;
export type ShipmentTrackingInput = z.infer<typeof shipmentTrackingSchema>;
export type EscrowReferenceInput = z.infer<typeof escrowReferenceSchema>;
export type UpdateProductStockInput = z.infer<typeof updateProductStockSchema>;