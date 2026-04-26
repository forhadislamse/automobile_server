import { z } from 'zod';

const addTechnicianValidationSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: 'Full name is required',
    }),
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    passkey: z.string({
      required_error: 'Passkey is required',
    }).min(8, 'Passkey must be at least 8 characters'),
  }),
});

export const TechnicianValidation = {
  addTechnicianValidationSchema,
};
