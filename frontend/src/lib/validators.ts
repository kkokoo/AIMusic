import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

export const registerSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string(),
  verifyCode: z.string().length(6, '验证码为6位数字'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});

export const instrumentalFormSchema = z.object({
  prompt: z.string().min(10, '描述至少10个字符').max(2000, '描述最多2000个字符'),
  style: z.string().optional(),
  instrument: z.string().optional(),
  bpm: z.number().min(60).max(180).optional(),
  mood: z.string().optional(),
  durationSec: z.number().min(5).max(300),
});

export const songFormSchema = z.object({
  lyrics: z.string().min(5, '歌词至少5个字符').max(5000, '歌词最多5000个字符'),
  vocalGender: z.enum(['male', 'female', 'any']).optional(),
  vocalStyle: z.string().optional(),
  language: z.enum(['chinese', 'english', 'auto']).optional(),
  durationSec: z.number().min(10).max(300),
});

export const profileSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
});

export const passwordSchema = z.object({
  oldPassword: z.string().min(6, '请输入原密码'),
  newPassword: z.string().min(6, '新密码至少6位'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type InstrumentalFormData = z.infer<typeof instrumentalFormSchema>;
export type SongFormData = z.infer<typeof songFormSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;