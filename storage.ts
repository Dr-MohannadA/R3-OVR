import {
  users,
  facilities,
  categories,
  incidents,
  comments,
  auditLogs,
  userRegistrations,
  type User,
  type UpsertUser,
  type Facility,
  type InsertFacility,
  type Category,
  type InsertCategory,
  type Incident,
  type InsertIncident,
  type IncidentWithRelations,
  type Comment,
  type InsertComment,
  type CommentWithUser,
  type InsertAuditLog,
  type AuditLog,
  type UserWithStats,
  type UserRegistration,
  type InsertUserRegistration,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql, count, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<UserWithStats[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Facility operations
  getAllFacilities(): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  initializeFacilities(): Promise<void>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  initializeCategories(): Promise<void>;

  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncident(id: number): Promise<IncidentWithRelations | undefined>;
  getAllIncidents(filters?: {
    facilityId?: number;
    categoryId?: number;
    status?: string;
    userId?: string;
  }): Promise<IncidentWithRelations[]>;
  updateIncident(id: number, updates: Partial<Incident>): Promise<Incident>;
  deleteIncident(id: number): Promise<void>;
  getIncidentMetrics(): Promise<{
    total: number;
    open: number;
    inReview: number;
    closed: number;
    highPriority: number;
    activeFacilities: number;
  }>;
  generateOvrId(): Promise<string>;

  // User registration operations
  createUserRegistration(registration: InsertUserRegistration): Promise<UserRegistration>;
  getAllUserRegistrations(): Promise<UserRegistration[]>;
  updateUserRegistration(id: number, updates: Partial<UserRegistration>): Promise<UserRegistration>;
  getUserRegistrationByEmail(email: string): Promise<UserRegistration | undefined>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByIncident(incidentId: number): Promise<CommentWithUser[]>;
  deleteComment(id: number): Promise<void>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; resourceType?: string }): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    // Get all users first
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        facilityId: users.facilityId,
        position: users.position,
        isActive: users.isActive,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
        password: users.password,
        facility: {
          id: facilities.id,
          nameEn: facilities.nameEn,
          nameAr: facilities.nameAr,
          code: facilities.code,
        },
      })
      .from(users)
      .leftJoin(facilities, eq(users.facilityId, facilities.id));

    // Get incident counts separately - simplified to avoid isNotNull issues
    const incidentCounts = await db
      .select({
        userId: incidents.reportedById,
        totalIncidents: count(incidents.id),
      })
      .from(incidents)
      .groupBy(incidents.reportedById);

    // Combine the data
    const usersWithStats = allUsers.map(user => ({
      ...user,
      totalIncidents: incidentCounts.find(ic => ic.userId === user.id)?.totalIncidents || 0,
    }));

    return usersWithStats;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // First, handle all foreign key constraints
    
    // Delete audit logs referencing this user
    await db.delete(auditLogs).where(eq(auditLogs.userId, id));
    
    // Nullify user_registrations reviewed_by_id references
    await db
      .update(userRegistrations)
      .set({ reviewedById: null })
      .where(eq(userRegistrations.reviewedById, id));
    
    // Nullify incidents reported_by_id references  
    await db
      .update(incidents)
      .set({ reportedById: null })
      .where(eq(incidents.reportedById, id));
    
    // Nullify incidents assigned_to_id references
    await db
      .update(incidents)
      .set({ assignedToId: null })
      .where(eq(incidents.assignedToId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Facility operations
  async getAllFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.isActive, true));
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async initializeFacilities(): Promise<void> {
    const existingFacilities = await db.select().from(facilities);
    if (existingFacilities.length > 0) return;

    const hospitalList = [
      { nameEn: "Ad Diriyah Hospital", code: "ADH" },
      { nameEn: "Al Yamamah Hospital", code: "AYH" },
      { nameEn: "Irqah Hospital", code: "IRH" },
      { nameEn: "King Saud Medical Complex", code: "KSMC" },
      { nameEn: "North Riyadh Hospital", code: "NRH" },
      { nameEn: "Riyadh Care Hospital", code: "RCH" },
      { nameEn: "Al Eman Hospital", code: "AEH" },
      { nameEn: "King Fahd Medical City", code: "KFMC" },
      { nameEn: "Prince Sultan Military Medical City", code: "PSMMC" },
      { nameEn: "King Khalid University Hospital", code: "KKUH" },
      { nameEn: "King Abdulaziz Medical City", code: "KAMC" },
      { nameEn: "National Guard Health Affairs", code: "NGHA" },
      { nameEn: "King Faisal Specialist Hospital", code: "KFSH" },
      { nameEn: "Security Forces Hospital", code: "SFH" },
    ];

    await db.insert(facilities).values(hospitalList);
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async initializeCategories(): Promise<void> {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) return;

    const categoryList = [
      { name: "Patient Safety", description: "Incidents related to patient safety and care" },
      { name: "Equipment Failure", description: "Medical equipment malfunctions or failures" },
      { name: "Medication Error", description: "Errors in medication administration or prescription" },
      { name: "Falls", description: "Patient or staff falls and related injuries" },
      { name: "Infection Control", description: "Healthcare-associated infections and prevention failures" },
      { name: "Communication", description: "Communication breakdowns between staff or with patients" },
      { name: "Other", description: "Other incident types not covered by main categories" },
    ];

    await db.insert(categories).values(categoryList);
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const ovrId = await this.generateOvrId();
    const [newIncident] = await db
      .insert(incidents)
      .values({ ...incident, ovrId })
      .returning();
    return newIncident;
  }

  async getIncident(id: number): Promise<IncidentWithRelations | undefined> {
    const [incident] = await db
      .select({
        id: incidents.id,
        ovrId: incidents.ovrId,
        facilityId: incidents.facilityId,
        categoryId: incidents.categoryId,
        incidentDate: incidents.incidentDate,
        incidentTime: incidents.incidentTime,
        description: incidents.description,
        
        // Department Information
        reportingDepartment: incidents.reportingDepartment,
        respondingDepartment: incidents.respondingDepartment,
        
        // Patient Information  
        patientName: incidents.patientName,
        medicalRecord: incidents.medicalRecord,
        
        // Incident Classification
        whatIsBeingReported: incidents.whatIsBeingReported,
        
        // Reporter Information
        reporterName: incidents.reporterName,
        reporterMobile: incidents.reporterMobile,
        reporterEmail: incidents.reporterEmail,
        reporterPosition: incidents.reporterPosition,
        
        // Action & Classification
        actionTaken: incidents.actionTaken,
        ovrCategory: incidents.ovrCategory,
        typeOfInjury: incidents.typeOfInjury,
        levelOfHarm: incidents.levelOfHarm,
        likelihoodCategory: incidents.likelihoodCategory,
        medicationErrorDetails: incidents.medicationErrorDetails,
        
        // System fields
        status: incidents.status,
        priority: incidents.priority,
        isAnonymous: incidents.isAnonymous,
        contactInfo: incidents.contactInfo,
        reportedById: incidents.reportedById,
        assignedToId: incidents.assignedToId,
        closureRequestedBy: incidents.closureRequestedBy,
        closureRequestedAt: incidents.closureRequestedAt,
        closureApprovedBy: incidents.closureApprovedBy,
        closureApprovedAt: incidents.closureApprovedAt,
        closureReason: incidents.closureReason,
        createdAt: incidents.createdAt,
        updatedAt: incidents.updatedAt,
        facility: {
          id: facilities.id,
          nameEn: facilities.nameEn,
          nameAr: facilities.nameAr,
          code: facilities.code,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(incidents)
      .leftJoin(facilities, eq(incidents.facilityId, facilities.id))
      .leftJoin(categories, eq(incidents.categoryId, categories.id))
      .where(eq(incidents.id, id));

    return incident as IncidentWithRelations;
  }

  async getAllIncidents(filters?: {
    facilityId?: number;
    categoryId?: number;
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<IncidentWithRelations[]> {
    const conditions = [];
    if (filters?.facilityId) {
      conditions.push(eq(incidents.facilityId, filters.facilityId));
    }
    if (filters?.categoryId) {
      conditions.push(eq(incidents.categoryId, filters.categoryId));
    }
    if (filters?.status) {
      conditions.push(eq(incidents.status, filters.status));
    }
    if (filters?.userId) {
      conditions.push(eq(incidents.reportedById, filters.userId));
    }
    if (filters?.dateFrom) {
      conditions.push(sql`${incidents.incidentDate} >= ${filters.dateFrom}`);
    }
    if (filters?.dateTo) {
      conditions.push(sql`${incidents.incidentDate} <= ${filters.dateTo}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        id: incidents.id,
        ovrId: incidents.ovrId,
        facilityId: incidents.facilityId,
        categoryId: incidents.categoryId,
        incidentDate: incidents.incidentDate,
        incidentTime: incidents.incidentTime,
        description: incidents.description,
        
        // Department Information
        reportingDepartment: incidents.reportingDepartment,
        respondingDepartment: incidents.respondingDepartment,
        
        // Patient Information  
        patientName: incidents.patientName,
        medicalRecord: incidents.medicalRecord,
        
        // Incident Classification
        whatIsBeingReported: incidents.whatIsBeingReported,
        
        // Reporter Information
        reporterName: incidents.reporterName,
        reporterMobile: incidents.reporterMobile,
        reporterEmail: incidents.reporterEmail,
        reporterPosition: incidents.reporterPosition,
        
        // Action & Classification
        actionTaken: incidents.actionTaken,
        ovrCategory: incidents.ovrCategory,
        typeOfInjury: incidents.typeOfInjury,
        levelOfHarm: incidents.levelOfHarm,
        likelihoodCategory: incidents.likelihoodCategory,
        medicationErrorDetails: incidents.medicationErrorDetails,
        
        // System fields
        status: incidents.status,
        priority: incidents.priority,
        isAnonymous: incidents.isAnonymous,
        contactInfo: incidents.contactInfo,
        reportedById: incidents.reportedById,
        assignedToId: incidents.assignedToId,
        closureRequestedBy: incidents.closureRequestedBy,
        closureRequestedAt: incidents.closureRequestedAt,
        closureApprovedBy: incidents.closureApprovedBy,
        closureApprovedAt: incidents.closureApprovedAt,
        closureReason: incidents.closureReason,
        createdAt: incidents.createdAt,
        updatedAt: incidents.updatedAt,
        facility: {
          id: facilities.id,
          nameEn: facilities.nameEn,
          nameAr: facilities.nameAr,
          code: facilities.code,
        },
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        },
      })
      .from(incidents)
      .leftJoin(facilities, eq(incidents.facilityId, facilities.id))
      .leftJoin(categories, eq(incidents.categoryId, categories.id))
      .where(whereCondition)
      .orderBy(desc(incidents.createdAt));

    return result as IncidentWithRelations[];
  }

  async updateIncident(id: number, updates: Partial<any>): Promise<Incident> {
    const [updatedIncident] = await db
      .update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return updatedIncident;
  }

  async deleteIncident(id: number): Promise<void> {
    // First delete related records to avoid foreign key constraints
    
    // Delete comments first
    await db.delete(comments).where(eq(comments.incidentId, id));
    
    // Delete audit logs related to this incident
    await db.delete(auditLogs).where(
      and(
        eq(auditLogs.resourceType, 'incident'),
        eq(auditLogs.resourceId, id.toString())
      )
    );
    
    // Finally delete the incident
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  async getIncidentMetrics(): Promise<{
    total: number;
    open: number;
    inReview: number;
    closed: number;
    highPriority: number;
    activeFacilities: number;
  }> {
    const [metrics] = await db
      .select({
        total: count(),
        open: sql<number>`count(case when status = 'open' then 1 end)`,
        inReview: sql<number>`count(case when status = 'in_review' then 1 end)`,
        closed: sql<number>`count(case when status = 'closed' then 1 end)`,
        highPriority: sql<number>`count(case when priority = 'high' then 1 end)`,
      })
      .from(incidents);

    const [facilitiesCount] = await db
      .select({ activeFacilities: count() })
      .from(facilities)
      .where(eq(facilities.isActive, true));

    return {
      ...metrics,
      activeFacilities: facilitiesCount.activeFacilities,
    };
  }

  async generateOvrId(): Promise<string> {
    const year = new Date().getFullYear();
    const [lastIncident] = await db
      .select({ ovrId: incidents.ovrId })
      .from(incidents)
      .where(like(incidents.ovrId, `OVR-${year}-%`))
      .orderBy(desc(incidents.ovrId))
      .limit(1);

    let nextNumber = 1;
    if (lastIncident?.ovrId) {
      const lastNumber = parseInt(lastIncident.ovrId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `OVR-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getCommentsByIncident(incidentId: number): Promise<CommentWithUser[]> {
    const result = await db
      .select({
        id: comments.id,
        incidentId: comments.incidentId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          facilityId: users.facilityId,
          position: users.position,
          isActive: users.isActive,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastLoginAt: users.lastLoginAt,
          password: users.password,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.incidentId, incidentId))
      .orderBy(desc(comments.createdAt));

    return result as CommentWithUser[];
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // User registration operations
  async createUserRegistration(registration: InsertUserRegistration): Promise<UserRegistration> {
    const [userRegistration] = await db
      .insert(userRegistrations)
      .values(registration)
      .returning();
    return userRegistration;
  }

  async getAllUserRegistrations(): Promise<UserRegistration[]> {
    const result = await db
      .select({
        id: userRegistrations.id,
        email: userRegistrations.email,
        firstName: userRegistrations.firstName,
        lastName: userRegistrations.lastName,
        facilityId: userRegistrations.facilityId,
        position: userRegistrations.position,
        status: userRegistrations.status,
        requestedAt: userRegistrations.requestedAt,
        reviewedAt: userRegistrations.reviewedAt,
        reviewedById: userRegistrations.reviewedById,
        rejectionReason: userRegistrations.rejectionReason,
        facility: facilities,
      })
      .from(userRegistrations)
      .leftJoin(facilities, eq(userRegistrations.facilityId, facilities.id))
      .orderBy(desc(userRegistrations.requestedAt));
    
    return result as any[];
  }

  async updateUserRegistration(id: number, updates: Partial<UserRegistration>): Promise<UserRegistration> {
    const [userRegistration] = await db
      .update(userRegistrations)
      .set(updates)
      .where(eq(userRegistrations.id, id))
      .returning();
    return userRegistration;
  }

  async getUserRegistrationByEmail(email: string): Promise<UserRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(userRegistrations)
      .where(eq(userRegistrations.email, email));
    return registration;
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(filters?: { userId?: string; resourceType?: string }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(auditLogs)
      .where(whereCondition)
      .orderBy(desc(auditLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
