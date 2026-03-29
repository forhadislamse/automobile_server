import { z } from "zod";

const CreateUserValidationSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"), // Ensure email is provided and is valid

  name: z.string().optional(),
  password: z.string().nonempty("Password is required"),
});

export { CreateUserValidationSchema };
const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  password: z.string().nonempty("Password is required"),
});

const userUpdateSchema = z.object({
fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lang: z.number().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dob: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema,
  userUpdateSchema,
}; 
