import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { publicIncidentSchema, comprehensivePublicIncidentSchema, insertAuditLogSchema, insertUserRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data
  await storage.initializeFacilities();
  await storage.initializeCategories();

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("Auth check - Session:", req.session?.userId, "Auth Provider:", req.session?.authProvider);
      
      // Check for local session first
      if (req.session?.userId && req.session?.authProvider === 'local') {
        const user = await storage.getUser(req.session.userId);
        if (user && user.isActive) {
          const { password: _, ...userWithoutPassword } = user;
          console.log("Local user authenticated:", user.email);
          return res.json(userWithoutPassword);
        }
      }
      
      // Check for Replit auth (admin only)
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user && user.authProvider === 'replit') {
          console.log("Replit user authenticated:", user.email);
          return res.json(user);
        }
      }
      
      console.log("No valid authentication found");
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes
  app.get('/api/facilities', async (req, res) => {
    try {
      const facilities = await storage.getAllFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Public incident reporting (comprehensive form)
  app.post('/api/incidents/public', async (req, res) => {
    try {
      console.log("Received comprehensive incident data:", JSON.stringify(req.body, null, 2));
      
      const validatedData = comprehensivePublicIncidentSchema.parse(req.body);
      console.log("Validated comprehensive incident data:", JSON.stringify(validatedData, null, 2));
      
      // Get category by name or create a default one
      const categories = await storage.getAllCategories();
      const category = categories.find(c => c.name.toLowerCase() === validatedData.category.toLowerCase()) || categories[0];
      console.log("Selected category:", category);

      const incident = await storage.createIncident({
        facilityId: validatedData.facilityId,
        categoryId: category.id,
        incidentDate: new Date(validatedData.incidentDate),
        incidentTime: validatedData.incidentTime,
        description: validatedData.description,
        
        // Department Information
        reportingDepartment: validatedData.reportingDepartment,
        respondingDepartment: validatedData.respondingDepartment,
        
        // Patient Information
        patientName: validatedData.patientName || null,
        medicalRecord: validatedData.medicalRecord,
        
        // Incident Classification
        whatIsBeingReported: validatedData.whatIsBeingReported,
        
        // Reporter Information (Optional)
        reporterName: validatedData.reporterName || null,
        reporterMobile: validatedData.reporterMobile || null,
        reporterEmail: validatedData.reporterEmail || null,
        reporterPosition: validatedData.reporterPosition || null,
        
        // Action & Classification
        actionTaken: validatedData.actionTaken,
        ovrCategory: validatedData.ovrCategory,
        typeOfInjury: JSON.stringify(validatedData.typeOfInjury), // Store as JSON
        levelOfHarm: validatedData.levelOfHarm,
        likelihoodCategory: validatedData.likelihoodCategory,
        medicationErrorDetails: validatedData.medicationErrorDetails || null,
        
        // System fields
        isAnonymous: !validatedData.reporterName && !validatedData.reporterEmail,
        contactInfo: validatedData.reporterEmail || validatedData.reporterMobile || null,
        reportedById: null,
        assignedToId: null,
      });
      
      console.log("Created incident with comprehensive data:", JSON.stringify(incident, null, 2));

      res.json({ 
        success: true, 
        ovrId: incident.ovrId,
        message: "Incident reported successfully" 
      });
    } catch (error) {
      console.error("Error creating public incident:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create incident" });
    }
  });

  // User registration route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserRegistrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if registration request already exists
      const existingRegistration = await storage.getUserRegistrationByEmail(validatedData.email);
      if (existingRegistration) {
        return res.status(400).json({ message: "Registration request already exists for this email" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create registration request
      const registration = await storage.createUserRegistration({
        ...validatedData,
        password: hashedPassword
      });
      
      res.json({ 
        success: true, 
        message: "Registration request submitted successfully. Please wait for admin approval.",
        registrationId: registration.id
      });
    } catch (error) {
      console.error("Error creating registration request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to submit registration request" });
    }
  });

  // Local user login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user exists and is approved
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user has local auth
      if (user.authProvider !== 'local' || !user.password) {
        return res.status(401).json({ message: "Invalid login method" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated. Please contact admin." });
      }

      // Check registration status - if user was created from approved registration
      const registration = await storage.getUserRegistrationByEmail(email);
      if (registration && registration.status === 'rejected') {
        return res.status(403).json({ 
          message: "Your registration was rejected. Please contact admin for assistance." 
        });
      }

      if (registration && registration.status === 'pending') {
        return res.status(403).json({ 
          message: "Your registration is pending approval. Please wait for admin approval." 
        });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Create session manually for local users
      (req.session as any).userId = user.id;
      (req.session as any).authProvider = 'local';
      
      // Save session explicitly with better error handling
      await new Promise((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for user:", user.email);
            resolve(null);
          }
        });
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to authenticate" });
    }
  });

  // Local user logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Custom authentication middleware for dual auth
  const isAuthenticatedLocal = async (req: any, res: any, next: any) => {
    // Check for local session first
    if (req.session?.userId && req.session?.authProvider === 'local') {
      const user = await storage.getUser(req.session.userId);
      if (user && user.isActive) {
        req.user = { localUser: user };
        return next();
      }
    }
    
    // Check for Replit auth
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user && user.authProvider === 'replit') {
        return next();
      }
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Protected routes
  app.get('/api/incidents', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const { facilityId, categoryId, status, dateFrom, dateTo } = req.query;
      
      // Get user ID from either local or Replit auth
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      
      const filters: any = {};
      if (facilityId && facilityId !== 'all') filters.facilityId = parseInt(facilityId);
      if (categoryId && categoryId !== 'all') filters.categoryId = parseInt(categoryId);
      if (status && status !== 'all') filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      
      // Non-admin users can only see incidents from their facility
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin' && user?.facilityId) {
        filters.facilityId = user.facilityId;
      }

      const incidents = await storage.getAllIncidents(filters);
      console.log("Retrieved incidents with comprehensive data:", JSON.stringify(incidents, null, 2));
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.get('/api/incidents/metrics', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const metrics = await storage.getIncidentMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching incident metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get('/api/incidents/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const incident = await storage.getIncident(parseInt(req.params.id));
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  app.patch('/api/incidents/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      // Get user ID from either local or Replit auth
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      
      // Verify incident exists and user can access it
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Facility-based access control for non-admins
      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      // Restrict what regular users can update
      let allowedUpdates = req.body;
      if (user?.role !== 'admin') {
        // Regular users can only update status (but not to "closed"), and flagging
        const { status, isFlagged } = req.body;
        allowedUpdates = {};
        
        if (status && status !== 'closed') {
          allowedUpdates.status = status;
        }
        
        if (isFlagged !== undefined) {
          allowedUpdates.isFlagged = isFlagged;
        }
      }

      const updatedIncident = await storage.updateIncident(incidentId, allowedUpdates);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "update_incident",
        resourceType: "incident",
        resourceId: req.params.id,
        details: allowedUpdates,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(updatedIncident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  // Get individual incident with details
  app.get('/api/incidents/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);

      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Verify user can access this incident (facility-based for non-admins)
      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      res.json(incident);
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  // Add comment to incident
  app.post('/api/incidents/:id/comments', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment cannot be empty" });
      }

      // Verify user can access this incident (facility-based for non-admins)
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      // Create the comment
      const comment = await storage.createComment({
        incidentId,
        userId,
        content: content.trim(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "add_comment",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { commentId: comment.id, comment: content.trim() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ 
        success: true, 
        message: "Comment added successfully",
        comment 
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get comments for incident
  app.get('/api/incidents/:id/comments', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      
      // Verify incident exists and user can access it
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Facility-based access control for non-admins
      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      const comments = await storage.getCommentsByIncident(incidentId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Upload proof for incident
  app.post('/api/incidents/:id/proof', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);

      // Verify user can access this incident (facility-based for non-admins)
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      // Note: In a production environment, you would handle file upload here
      // For now, we'll just log the action
      await storage.createAuditLog({
        userId,
        action: "upload_proof",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { message: "Proof document uploaded" },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ 
        success: true, 
        message: "Proof uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading proof:", error);
      res.status(500).json({ message: "Failed to upload proof" });
    }
  });

  // Request closure (for users)
  app.post('/api/incidents/:id/request-closure', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      const { reason } = req.body;

      // Verify user can access this incident
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Check facility access for non-admins
      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      // Check if incident is already closed or pending closure
      if (incident.status === 'closed') {
        return res.status(400).json({ message: "Incident is already closed" });
      }
      if (incident.status === 'pending_closure') {
        return res.status(400).json({ message: "Incident is already pending closure approval" });
      }

      // Update incident status to pending_closure
      const updatedIncident = await storage.updateIncident(incidentId, {
        status: 'pending_closure',
        closureRequestedBy: userId,
        closureRequestedAt: new Date(),
        closureReason: reason,
      });

      // Add comment for closure request
      await storage.createComment({
        incidentId,
        userId,
        content: `🔒 **Closure Requested**\n\nReason: ${reason}\n\nThis incident has been submitted for admin approval to close.`,
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "request_closure",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { reason, status: 'pending_closure' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, message: "Closure request submitted for admin approval", incident: updatedIncident });
    } catch (error) {
      console.error("Error requesting closure:", error);
      res.status(500).json({ message: "Failed to request closure" });
    }
  });

  // Approve closure (for admins)
  app.post('/api/incidents/:id/approve-closure', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);

      // Only admins can approve closures
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can approve closures" });
      }

      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      if (incident.status !== 'pending_closure') {
        return res.status(400).json({ message: "Incident is not pending closure" });
      }

      // Update incident status to closed
      const updatedIncident = await storage.updateIncident(incidentId, {
        status: 'closed',
        closureApprovedBy: userId,
        closureApprovedAt: new Date(),
      });

      // Add comment for closure approval
      await storage.createComment({
        incidentId,
        userId,
        content: `✅ **Closure Approved**\n\nThe closure request has been reviewed and approved. This incident is now closed.\n\nOriginal closure reason: ${incident.closureReason || 'No reason provided'}`,
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "approve_closure",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { 
          previousStatus: 'pending_closure',
          newStatus: 'closed',
          requestedBy: incident.closureRequestedBy,
          approvedBy: userId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, message: "Incident closure approved", incident: updatedIncident });
    } catch (error) {
      console.error("Error approving closure:", error);
      res.status(500).json({ message: "Failed to approve closure" });
    }
  });

  // Reject closure (for admins)
  app.post('/api/incidents/:id/reject-closure', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      const { reason } = req.body;

      // Only admins can reject closures
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can reject closures" });
      }

      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      if (incident.status !== 'pending_closure') {
        return res.status(400).json({ message: "Incident is not pending closure" });
      }

      // Add comment for closure rejection
      await storage.createComment({
        incidentId,
        userId,
        content: `❌ **Closure Rejected**\n\nReason: ${reason || 'No reason provided'}\n\nThe closure request has been reviewed and rejected. This incident remains open for further action.\n\nOriginal closure reason: ${incident.closureReason || 'No reason provided'}`,
      });

      // Update incident status back to in_review
      const updatedIncident = await storage.updateIncident(incidentId, {
        status: 'in_review',
        closureRequestedBy: null,
        closureRequestedAt: null,
        closureReason: null,
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "reject_closure",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { 
          reason: reason || 'No reason provided',
          requestedBy: incident.closureRequestedBy,
          rejectedBy: userId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, message: "Incident closure rejected", incident: updatedIncident });
    } catch (error) {
      console.error("Error rejecting closure:", error);
      res.status(500).json({ message: "Failed to reject closure" });
    }
  });

  // Edit incident fields with mandatory comment
  app.patch('/api/incidents/:id/edit', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      const { field, value, comment } = req.body;

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comment is required when editing incidents" });
      }

      if (!field || !value) {
        return res.status(400).json({ message: "Field and value are required" });
      }

      // Verify user can access this incident
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Check facility access for non-admins
      if (user?.role !== 'admin' && user?.facilityId !== incident.facilityId) {
        return res.status(403).json({ message: "Access denied to this incident" });
      }

      // Validate field and value
      if (!['ovrCategory', 'whatIsBeingReported'].includes(field)) {
        return res.status(400).json({ message: "Invalid field for editing" });
      }

      const oldValue = incident[field as keyof typeof incident];

      // Update the incident
      const updateData: any = {};
      updateData[field] = value;
      updateData.updatedAt = new Date();

      const updatedIncident = await storage.updateIncident(incidentId, updateData);

      // Add comment about the edit
      const fieldLabel = field === 'ovrCategory' ? 'Category' : 'Incident Type';
      const commentContent = `📝 **${fieldLabel} Updated**\n\nChanged from: ${oldValue}\nChanged to: ${value}\n\nReason: ${comment.trim()}`;
      
      await storage.createComment({
        incidentId,
        userId,
        content: commentContent,
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "edit_incident",
        resourceType: "incident",
        resourceId: incidentId.toString(),
        details: { 
          field,
          oldValue,
          newValue: value,
          comment: comment.trim()
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, message: `${fieldLabel} updated successfully`, incident: updatedIncident });
    } catch (error) {
      console.error("Error editing incident:", error);
      res.status(500).json({ message: "Failed to edit incident" });
    }
  });

  app.delete('/api/incidents/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      const incidentId = parseInt(req.params.id);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Only admins can delete incidents." });
      }

      // Check if incident exists before attempting to delete
      const incident = await storage.getIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Store incident details for audit log before deletion
      const incidentDetails = {
        ovrId: incident.ovrId,
        facilityId: incident.facilityId,
        categoryId: incident.categoryId,
        status: incident.status
      };

      // Delete the incident (this now handles related records)
      await storage.deleteIncident(incidentId);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "delete_incident",
        resourceType: "incident",
        resourceId: req.params.id,
        details: incidentDetails,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true, message: "Incident deleted successfully" });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ 
        message: "Failed to delete incident", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedUser = await storage.updateUser(req.params.id, req.body);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: "update_user",
        resourceType: "user",
        resourceId: req.params.id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteUser(req.params.id);
      
      // Create audit log only if the deleting user still exists
      try {
        await storage.createAuditLog({
          userId,
          action: "delete_user",
          resourceType: "user", 
          resourceId: req.params.id,
          details: {},
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      } catch (auditError) {
        console.warn("Could not create audit log for user deletion:", auditError);
        // Continue with successful response even if audit log fails
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Audit logs (admin only)
  app.get('/api/audit-logs', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { resourceType, targetUserId } = req.query;
      const filters: any = {};
      if (resourceType) filters.resourceType = resourceType;
      if (targetUserId) filters.userId = targetUserId;

      const auditLogs = await storage.getAuditLogs(filters);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Admin routes for registration management
  app.get('/api/admin/registrations', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const registrations = await storage.getAllUserRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post('/api/admin/registrations/:id/approve', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const registrationId = parseInt(req.params.id);
      const registration = await storage.updateUserRegistration(registrationId, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedById: userId
      });

      // Create local user account from approved registration
      const newUser = await storage.upsertUser({
        id: registration.email, // Use email as ID for local users
        email: registration.email,
        firstName: registration.firstName,
        lastName: registration.lastName,
        facilityId: registration.facilityId,
        position: registration.position,
        role: 'user',
        isActive: true,
      });
      
      // Set password separately if needed (since it's not in the schema)
      if (registration.password) {
        await storage.updateUser(newUser.id, { password: registration.password });
      }

      // Log the approval action
      await storage.createAuditLog({
        userId: userId,
        action: 'approve_registration',
        resourceType: 'user_registration',
        resourceId: registrationId.toString(),
        details: `Approved registration for ${registration.email} and created local user account`
      });

      res.json({ 
        success: true, 
        message: "Registration approved and user account created",
        user: newUser
      });
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ message: "Failed to approve registration" });
    }
  });

  app.post('/api/admin/registrations/:id/reject', isAuthenticatedLocal, async (req: any, res) => {
    try {
      const userId = req.user.localUser?.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const registrationId = parseInt(req.params.id);
      const { reason } = req.body;

      const registration = await storage.updateUserRegistration(registrationId, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedById: userId,
        rejectionReason: reason
      });

      // Log the rejection action
      await storage.createAuditLog({
        userId: userId,
        action: 'reject_registration',
        resourceType: 'user_registration',
        resourceId: registrationId.toString(),
        details: `Rejected registration for ${registration.email}: ${reason}`
      });

      res.json({ 
        success: true, 
        message: "Registration rejected",
        registration
      });
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ message: "Failed to reject registration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
