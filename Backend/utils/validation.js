import { z } from 'zod';
import { ApiError } from './apiError.js';

// User Registration Schema
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Please enter a valid full name (minimum 2 characters).' })
    .trim()
    .min(2, 'Please enter a valid full name (minimum 2 characters).'),
  email: z
    .string({ required_error: 'Please enter a valid email address.' })
    .trim()
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Password must be at least 6 characters.' })
    .min(6, 'Password must be at least 6 characters.'),
  postalCode: z
    .string({ required_error: 'Please enter a valid postal code (minimum 3 characters).' })
    .trim()
    .min(3, 'Please enter a valid postal code (minimum 3 characters).'),
  role: z.enum(['borrower', 'owner', 'admin']).optional().default('borrower'),
});

// User Login Schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Please specify both email and password.' })
    .trim()
    .min(1, 'Please specify both email and password.')
    .email('Please enter a valid email address.'),
  password: z
    .string({ required_error: 'Please specify both email and password.' })
    .min(1, 'Please specify both email and password.'),
});

// User Profile Update Schema
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  postalCode: z.string().trim().min(3).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  locationSettings: z
    .object({
      homeAddress: z.string().optional(),
      maxDistance: z.number().nonnegative().optional(),
      publicLocation: z.boolean().optional(),
    })
    .optional(),
});

// Tool Creation Schema
export const toolCreateSchema = z.object({
  name: z.string({ required_error: 'Tool name is required.' }).trim().min(2, 'Tool name must be at least 2 characters.'),
  title: z.string().trim().min(2).optional(),
  category: z.string({ required_error: 'Category is required.' }).trim().min(1, 'Category is required.'),
  pricePerDay: z.coerce
    .number({ required_error: 'Price per day must be a positive number.' })
    .positive('Price per day must be greater than 0.'),
  postalCode: z.string({ required_error: 'Postal code is required.' }).trim().min(3, 'Postal code must be at least 3 characters.'),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

// Tool Update Schema
export const toolUpdateSchema = toolCreateSchema.partial();

// Booking Creation Schema
export const bookingCreateSchema = z.object({
  toolId: z.string({ required_error: 'Tool ID is required.' }).min(1, 'Tool ID is required.'),
  startDate: z.string({ required_error: 'Start date is required.' }).min(1, 'Start date is required.'),
  endDate: z.string({ required_error: 'End date is required.' }).min(1, 'End date is required.'),
});

// Booking Status Transition Schema
export const bookingStatusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned'], {
    required_error: 'Valid status is required.',
  }),
});

// Stripe Checkout Session Schema
export const checkoutSessionSchema = z.object({
  bookingId: z.string({ required_error: 'Booking ID is required.' }).min(1, 'Booking ID is required.'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Middleware generator for Zod request validation
 * Validates req.body, req.query, or req.params
 */
export function validateRequest(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[target];
      const parsed = schema.parse(dataToValidate);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const errorMsg = firstIssue ? firstIssue.message : 'Invalid request data.';
        const formattedErrors = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({
          success: false,
          error: errorMsg,
          message: errorMsg,
          errors: formattedErrors,
        });
      }
      next(err);
    }
  };
}
