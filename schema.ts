import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table 
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // admin, user
  facilityId: integer("facility_id").references(() => facilities.id),
  position: varchar("position"),
  isActive: boolean("is_active").default(true),
  password: varchar("password"), // For local users only, null for Replit users
  authProvider: varchar("auth_provider").notNull().default("local"), // local, replit
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en").notNull(),
  nameAr: varchar("name_ar"),
  code: varchar("code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  ovrId: varchar("ovr_id").notNull().unique(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  
  // Event Details
  incidentDate: timestamp("incident_date").notNull(),
  incidentTime: varchar("incident_time").notNull(),
  description: text("description").notNull(),
  
  // Department Information
  reportingDepartment: varchar("reporting_department").notNull(), // From which department
  respondingDepartment: varchar("responding_department").notNull(), // To which department
  
  // Patient Information
  patientName: varchar("patient_name"), // Optional
  medicalRecord: varchar("medical_record").notNull(),
  
  // Incident Classification
  whatIsBeingReported: varchar("what_is_being_reported").notNull(), // incident, near_miss, mandatory_reportable_event, sentinel_event
  
  // Reporter Information (Optional for feedback)
  reporterName: varchar("reporter_name"),
  reporterMobile: varchar("reporter_mobile"),
  reporterEmail: varchar("reporter_email"),
  reporterPosition: varchar("reporter_position"),
  
  // Action & Classification
  actionTaken: text("action_taken").notNull(),
  ovrCategory: varchar("ovr_category").notNull(),
  typeOfInjury: text("type_of_injury"), // JSON array of selected injuries
  levelOfHarm: varchar("level_of_harm").notNull(), // no_harm, low, moderate, severe, death
  likelihoodCategory: varchar("likelihood_category").notNull(),
  medicationErrorDetails: text("medication_error_details"), // Conditional field
  
  // System fields
  status: varchar("status").notNull().default("open"), // open, in_review, pending_closure, closed
  priority: varchar("priority").notNull().default("medium"), // low, medium, high
  isAnonymous: boolean("is_anonymous").default(false),
  contactInfo: varchar("contact_info"),
  reportedById: varchar("reported_by_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  closureRequestedBy: varchar("closure_requested_by").references(() => users.id),
  closureRequestedAt: timestamp("closure_requested_at"),
  closureApprovedBy: varchar("closure_approved_by").references(() => users.id),
  closureApprovedAt: timestamp("closure_approved_at"),
  closureReason: text("closure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User registration requests table
export const userRegistrations = pgTable("user_registrations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  facilityId: integer("facility_id").references(() => facilities.id).notNull(),
  position: varchar("position").notNull(),
  password: varchar("password").notNull(), // Hashed password for local auth
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  rejectionReason: text("rejection_reason"),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").references(() => incidents.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(),
  resourceType: varchar("resource_type").notNull(), // incident, user, facility
  resourceId: varchar("resource_id").notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reportedIncidents: many(incidents, { relationName: "reporter" }),
  assignedIncidents: many(incidents, { relationName: "assignee" }),
  comments: many(comments),
  auditLogs: many(auditLogs),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  incidents: many(incidents),
  registrations: many(userRegistrations),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [incidents.facilityId],
    references: [facilities.id],
  }),
  category: one(categories, {
    fields: [incidents.categoryId],
    references: [categories.id],
  }),
  reporter: one(users, {
    fields: [incidents.reportedById],
    references: [users.id],
    relationName: "reporter",
  }),
  assignee: one(users, {
    fields: [incidents.assignedToId],
    references: [users.id],
    relationName: "assignee",
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  incident: one(incidents, {
    fields: [comments.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const userRegistrationsRelations = relations(userRegistrations, ({ one }) => ({
  facility: one(facilities, {
    fields: [userRegistrations.facilityId],
    references: [facilities.id],
  }),
  reviewer: one(users, {
    fields: [userRegistrations.reviewedById],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  facilityId: true,
  position: true,
  isActive: true,
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  ovrId: true,
  createdAt: true,
  updatedAt: true,
});

// Comprehensive public incident schema for the new form
export const comprehensivePublicIncidentSchema = z.object({
  // Basic Information
  facilityId: z.number().min(1),
  incidentDate: z.string(),
  incidentTime: z.string(),
  
  // Department Information
  reportingDepartment: z.string().min(1),
  respondingDepartment: z.string().min(1),
  
  // Patient Information
  patientName: z.string().optional(),
  medicalRecord: z.string().min(1),
  
  // Incident Details
  whatIsBeingReported: z.enum(["incident", "near_miss", "mandatory_reportable_event", "sentinel_event"]),
  description: z.string().min(10),
  
  // Reporter Information (Optional)
  reporterName: z.string().optional(),
  reporterMobile: z.string().optional(), 
  reporterEmail: z.string().email().optional().or(z.literal("")),
  reporterPosition: z.string().optional(),
  
  // Action & Classification
  actionTaken: z.string().min(10),
  ovrCategory: z.string().min(1),
  typeOfInjury: z.array(z.string()).min(1),
  levelOfHarm: z.enum(["no_harm", "low", "moderate", "severe", "death"]),
  likelihoodCategory: z.enum(["rare", "unlikely", "possible", "likely", "almost_certain"]),
  medicationErrorDetails: z.string().optional(),
  
  // Legacy compatibility
  category: z.string().default("general"),
});

export const publicIncidentSchema = insertIncidentSchema
  .omit({
    reportedById: true,
    assignedToId: true,
    status: true,
    priority: true,
    incidentDate: true,
  })
  .extend({
    incidentDate: z.string().min(1),
    levelOfHarm: z.enum(["no_harm", "low", "moderate", "severe", "death"]),
  });

export const insertUserRegistrationSchema = createInsertSchema(userRegistrations).omit({
  id: true,
  status: true,
  requestedAt: true,
  reviewedAt: true,
  reviewedById: true,
  rejectionReason: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserRegistration = z.infer<typeof insertUserRegistrationSchema>;
export type UserRegistration = typeof userRegistrations.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type PublicIncident = z.infer<typeof publicIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Extended types with relations
export type IncidentWithRelations = Incident & {
  facility: Facility;
  category: Category;
  reporter?: User;
  assignee?: User;
  comments?: CommentWithUser[];
};

export type CommentWithUser = Comment & {
  user: User;
};

export type UserWithStats = User & {
  totalIncidents?: number;
  openIncidents?: number;
};
