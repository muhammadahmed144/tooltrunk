import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter a valid full name (minimum 2 characters).'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.'),
  postalCode: z
    .string()
    .trim()
    .min(3, 'Please enter a valid postal code (minimum 3 characters).'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Please enter your password.'),
});

export const addToolSchema = z.object({
  name: z.string().trim().min(2, 'Tool name must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  pricePerDay: z.coerce.number().positive('Daily price must be greater than 0.'),
  postalCode: z.string().trim().min(3, 'Postal code must be at least 3 characters.'),
  description: z.string().trim().min(5, 'Please provide a short description.'),
  imageUrl: z.string().url().or(z.literal('')).optional(),
});

export const bookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
});
