//src/db/schema/users.ts
import {
  pgTable, text, timestamp, boolean,
  pgEnum, varchar, index, uniqueIndex,
} from 'drizzle-orm/pg-core'

export const planTypeEnum = pgEnum('plan_type', ['FREE', 'PRO', 'ELITE'])
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  plan: planTypeEnum('plan').notNull().default('FREE'),
  role: userRoleEnum('role').notNull().default('user'),
  timezone: text('timezone').notNull().default('UTC'),
  currency: text('currency').notNull().default('USD'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  referralCode: text('referral_code').unique(),
  referredById: text('referred_by_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  nickname: varchar('nickname', { length: 50 }),
  showOnLeaderboard: boolean('show_on_leaderboard').default(true),
  welcomeEmailSent: boolean('welcome_email_sent').notNull().default(false),
}, (t) => [
  index('users_plan_idx').on(t.plan),
  index('users_show_on_leaderboard_idx').on(t.showOnLeaderboard),
  index('users_created_at_idx').on(t.createdAt),
  index('users_stripe_customer_id_idx').on(t.stripeCustomerId),
])

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('sessions_user_id_idx').on(t.userId),
  // better-auth lookup po tokenu
  index('sessions_token_idx').on(t.token),
])

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('accounts_user_id_idx').on(t.userId),
])

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('verifications_identifier_idx').on(t.identifier),
])