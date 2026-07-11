import { z } from 'zod';

const objectSchema = z.object({}).passthrough();
// Элементы массива могут быть как объектами (masters, appointments, favorites),
// так и примитивами (slots — массив строк вида "10:00"). Проверяем только то,
// что значение по ключу — действительно массив; форму отдельных элементов
// каждый вызывающий код проверяет сам, если ему это нужно.
const arrayItemSchema = z.any();
const idSchema = z.union([z.string(), z.number()]).optional();

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

export const authSuccessSchema = z.object({
  success: z.literal(true),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  user: userSchema.optional(),
  error: z.string().optional(),
}).passthrough();

export const authFailureSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
}).passthrough();

export const currentUserSchema = z.object({
  success: z.boolean(),
  user: userSchema.optional(),
  error: z.string().optional(),
}).passthrough();

export const validateCurrentUserPayload = (payload) => {
  const parsed = currentUserSchema.safeParse(payload);

  if (!parsed.success) {
    return { success: false, error: 'Invalid user payload from server' };
  }

  const data = parsed.data;

  if (!data.success) {
    return { success: false, error: data.error || 'Authentication failed' };
  }

  if (!data.user || !userSchema.safeParse(data.user).success) {
    return { success: false, error: 'Invalid user data received from server' };
  }

  return { success: true, user: data.user };
};

export const validateAuthPayload = (payload) => {
  const parsed = z.union([authSuccessSchema, authFailureSchema]).safeParse(payload);

  if (!parsed.success) {
    return { success: false, error: 'Invalid authentication response from server' };
  }

  const data = parsed.data;

  if (!data.success) {
    return { success: false, error: data.error || 'Authentication failed' };
  }

  if (!data.user || !userSchema.safeParse(data.user).success) {
    return { success: false, error: 'Invalid user data received from server' };
  }

  if (!data.access_token && !data.refresh_token) {
    return { success: false, error: 'Invalid authentication response from server' };
  }

  return {
    success: true,
    user: data.user,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
};

export const getValidatedArray = (payload, key) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  const parsed = z.object({ [key]: z.array(arrayItemSchema) }).safeParse(payload);
  return parsed.success ? parsed.data[key] : [];
};

export const getValidatedObject = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const parsed = objectSchema.safeParse(payload);
  return parsed.success ? parsed.data : {};
};

export const getValidatedAppointment = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const parsed = objectSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
};
