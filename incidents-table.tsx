import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MessageSquare, Clock, Flag, Upload, Trash2, ClipboardList, Check, X, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface IncidentsTableProps {
  facilityFilter: string;
  categoryFilter: string;
  statusFilter: string;
  dateFromFilter: string;
  dateToFilter: string;
}

export function IncidentsTable({ 
  facilityFilter, 
  categoryFilter,
  statusFilter,
  dateFromFilter,
  dateToFilter
}: IncidentsTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [requestClosureDialogOpen, setRequestClosureDialogOpen] = useState(false);
  const [rejectClosureDialogOpen, setRejectClosureDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [closureReason, setClosureReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Edit functionality state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editField, setEditField] = useState<'ovrCategory' | 'whatIsBeingReported' | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editComment, setEditComment] = useState("");

  // Fetch incidents with proper query parameters
  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ['/api/incidents', { 
      facilityId: facilityFilter, 
      categoryId: categoryFilter, 
      status: statusFilter,
      dateFrom: dateFromFilter,
      dateTo: dateToFilter 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (facilityFilter !== 'all') params.append('facilityId', facilityFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);
      
      const response = await fetch(`/api/incidents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
    retry: false,
  });

  // Fetch comments for selected incident
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['/api/incidents', selectedIncident?.id, 'comments'],
    queryFn: async () => {
      if (!selectedIncident?.id) return [];
      const response = await fetch(`/api/incidents/${selectedIncident.id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!selectedIncident?.id,
    retry: false,
    staleTime: 0, // Always refetch comments to ensure fresh data
    refetchOnWindowFocus: true,
  });

  // Mutations
  const addCommentMutation = useMutation({
    mutationFn: async ({ incidentId, content }: { incidentId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      // Reset form state
      setNewComment("");
      setCommentDialogOpen(false);
      
      // Force refresh comments
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', selectedIncident?.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      
      // Show success message
      toast({ title: "Message sent successfully" });
      
      // Reopen view dialog with updated data
      setViewDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const res = await apiRequest('PATCH', `/api/incidents/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      setStatusDialogOpen(false);
      setViewDialogOpen(false);
      toast({ title: "Incident updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update incident", description: error.message, variant: "destructive" });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ incidentId, file }: { incidentId: number; file: File }) => {
      const formData = new FormData();
      formData.append('proof', file);
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/proof`, formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      setProofFile(null);
      setProofDialogOpen(false);
      toast({ title: "Proof uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload proof", description: error.message, variant: "destructive" });
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/incidents/${id}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      setViewDialogOpen(false); // Close view dialog if open
      toast({ 
        title: "Incident deleted successfully", 
        description: "The incident and all related data have been permanently removed."
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete incident", 
        description: error.message || "An unexpected error occurred while deleting the incident.",
        variant: "destructive" 
      });
    },
  });

  // Closure workflow mutations
  const requestClosureMutation = useMutation({
    mutationFn: async ({ incidentId, reason }: { incidentId: number; reason: string }) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/request-closure`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', selectedIncident?.id, 'comments'] });
      setClosureReason("");
      setRequestClosureDialogOpen(false);
      setViewDialogOpen(false);
      toast({ title: "Closure request submitted for admin approval" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to request closure", description: error.message, variant: "destructive" });
    },
  });

  const approveClosureMutation = useMutation({
    mutationFn: async (incidentId: number) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/approve-closure`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', selectedIncident?.id, 'comments'] });
      setViewDialogOpen(false);
      toast({ title: "Incident closure approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve closure", description: error.message, variant: "destructive" });
    },
  });

  const rejectClosureMutation = useMutation({
    mutationFn: async ({ incidentId, reason }: { incidentId: number; reason: string }) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/reject-closure`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', selectedIncident?.id, 'comments'] });
      setRejectionReason("");
      setRejectClosureDialogOpen(false);
      setViewDialogOpen(false);
      toast({ title: "Closure request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reject closure", description: error.message, variant: "destructive" });
    },
  });

  // Edit incident mutation
  const editIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, field, value, comment }: { 
      incidentId: number; 
      field: string; 
      value: string; 
      comment: string; 
    }) => {
      const res = await apiRequest('PATCH', `/api/incidents/${incidentId}/edit`, { 
        field, 
        value, 
        comment 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', selectedIncident?.id, 'comments'] });
      setEditDialogOpen(false);
      setEditField(null);
      setEditValue("");
      setEditComment("");
      toast({ title: "Incident updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update incident", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive" as const,
      in_review: "secondary" as const,
      pending_closure: "default" as const,
      closed: "outline" as const,
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive" as const,
      medium: "secondary" as const,
      low: "default" as const,
    };
    return (
      <Badge variant={variants[priority as keyof typeof variants] || "default"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getIncidentTypeBadge = (incidentType: string) => {
    switch (incidentType) {
      case 'incident':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Incident</Badge>;
      case 'near_miss':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Near Miss</Badge>;
      case 'mandatory_reportable_event':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Mandatory Reportable</Badge>;
      case 'sentinel_event':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Sentinel Event</Badge>;
      default:
        return <Badge variant="secondary">{incidentType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading incidents...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isAuthError = error.message.includes('401') || error.message.includes('Unauthorized');
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            {isAuthError ? (
              <div className="space-y-3">
                <p className="text-amber-600 font-medium">Authentication Required</p>
                <p className="text-sm text-gray-600">
                  Please log in to view incident reports. If you're already logged in, try refreshing the page.
                </p>
                <Button 
                  onClick={() => {
                    // For local authentication, redirect to our login page
                    window.location.href = '/login';
                  }}
                  className="mt-2"
                >
                  Go to Login Page
                </Button>
              </div>
            ) : (
              <div className="text-red-600">
                Error loading incidents. Please try refreshing the page or contact support.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Incident Reports ({incidents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OVR ID</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No incidents found
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents?.map((incident: any) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.ovrId}</TableCell>
                      <TableCell>{incident.facility?.nameEn || 'Unknown'}</TableCell>
                      <TableCell>{incident.ovrCategory}</TableCell>
                      <TableCell>
                        {format(new Date(incident.incidentDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
                      <TableCell>{getPriorityBadge(incident.priority)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setSelectedIncident(incident);
                              setViewDialogOpen(true);
                              // Force refresh comments when opening view dialog
                              if (incident.id) {
                                await queryClient.invalidateQueries({
                                  queryKey: ['/api/incidents', incident.id, 'comments']
                                });
                              }
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(user as any)?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete incident ${incident.ovrId}?\n\nThis action cannot be undone and will remove:\n- The incident record\n- All comments and discussions\n- Related audit logs`)) {
                                  deleteIncidentMutation.mutate(incident.id);
                                }
                              }}
                              disabled={deleteIncidentMutation.isPending}
                              title="Delete Incident"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleteIncidentMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {incidents?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No incidents found</p>
              </div>
            ) : (
              incidents?.map((incident: any) => (
                <Card key={incident.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={async () => {
                    setSelectedIncident(incident);
                    setViewDialogOpen(true);
                    // Force refresh comments when opening view dialog
                    if (incident.id) {
                      await queryClient.invalidateQueries({
                        queryKey: ['/api/incidents', incident.id, 'comments']
                      });
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{incident.ovrId}</span>
                      {incident.isFlagged && (
                        <Badge variant="destructive" className="text-xs">
                          <Flag className="w-3 h-3 mr-1" />
                          FLAGGED
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">{incident.facility?.nameEn || 'Unknown'}</span>
                        <span className="text-gray-500">{format(new Date(incident.incidentDate), 'MMM dd')}</span>
                      </div>
                      <div className="text-gray-600">{incident.ovrCategory}</div>
                      <div className="flex justify-between items-center pt-1">
                        {getStatusBadge(incident.status)}
                        {getPriorityBadge(incident.priority)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Incident Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Incident Details - {selectedIncident?.ovrId || 'Unknown'}
              {selectedIncident?.isFlagged && (
                <Badge variant="destructive" className="ml-2">
                  <Flag className="w-3 h-3 mr-1" />
                  FLAGGED
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Facility</Label>
                  <p className="text-sm mt-1">{selectedIncident.facility?.nameEn || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedIncident.facility?.nameAr}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-600">OVR Category</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditField('ovrCategory');
                        setEditValue((selectedIncident as any).ovrCategory || selectedIncident.category?.name);
                        setEditDialogOpen(true);
                      }}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm mt-1">{(selectedIncident as any).ovrCategory || selectedIncident.category?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                  <p className="text-sm mt-1">
                    {selectedIncident.incidentDate ? format(new Date(selectedIncident.incidentDate), 'PPP') : 'N/A'} at {selectedIncident.incidentTime || 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-600">What is being reported</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditField('whatIsBeingReported');
                        setEditValue((selectedIncident as any).whatIsBeingReported || 'incident');
                        setEditDialogOpen(true);
                      }}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm mt-1 capitalize">{((selectedIncident as any).whatIsBeingReported || 'incident').replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Level of Harm</Label>
                  <p className="text-sm mt-1 capitalize">{selectedIncident.levelOfHarm ? selectedIncident.levelOfHarm.replace('_', ' ') : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Likelihood Category</Label>
                  <p className="text-sm mt-1 capitalize">{((selectedIncident as any).likelihoodCategory || 'N/A').replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {selectedIncident.status ? getStatusBadge(selectedIncident.status) : <span className="text-gray-500">N/A</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priority</Label>
                  <div className="mt-1">
                    {selectedIncident.priority ? getPriorityBadge(selectedIncident.priority) : <span className="text-gray-500">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Department Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-800 mb-3 block">Department Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reporting Department</Label>
                    <p className="text-sm mt-1">{(selectedIncident as any).reportingDepartment || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Responding Department</Label>
                    <p className="text-sm mt-1">{(selectedIncident as any).respondingDepartment || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-800 mb-3 block">Patient Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Patient Name</Label>
                    <p className="text-sm mt-1">{(selectedIncident as any).patientName || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Medical Record</Label>
                    <p className="text-sm mt-1">{(selectedIncident as any).medicalRecord || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Incident Description */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600">Incident Description</Label>
                <div className="mt-2 p-3 rounded-lg bg-gray-50 border">
                  <p className="text-sm whitespace-pre-wrap">{selectedIncident.description || 'No description provided'}</p>
                </div>
              </div>

              {/* Action & Classification */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-800 mb-3 block">Action & Classification</Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Action Taken</Label>
                    <div className="mt-1 p-3 rounded-lg bg-gray-50 border">
                      <p className="text-sm whitespace-pre-wrap">{(selectedIncident as any).actionTaken || 'No actions specified'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Type of Injury</Label>
                      <div className="mt-1">
                        {(selectedIncident as any).typeOfInjury ? (
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse((selectedIncident as any).typeOfInjury).map((injury: string, index: number) => (
                              <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {injury}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Not specified</p>
                        )}
                      </div>
                    </div>
                    {(selectedIncident as any).medicationErrorDetails && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Medication Error Details</Label>
                        <div className="mt-1 p-2 rounded bg-orange-50 border border-orange-200">
                          <p className="text-sm">{(selectedIncident as any).medicationErrorDetails}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-800 mb-3 block">Reporter Information</Label>
                {selectedIncident.isAnonymous ? (
                  <p className="text-sm text-gray-500 italic">Anonymous report - no reporter information available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Reporter Name</Label>
                      <p className="text-sm mt-1">{selectedIncident.reporterName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Position</Label>
                      <p className="text-sm mt-1">{(selectedIncident as any).reporterPosition || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Mobile Number</Label>
                      <p className="text-sm mt-1">{(selectedIncident as any).reporterMobile || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <p className="text-sm mt-1">{(selectedIncident as any).reporterEmail || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat-style Comments Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-800">
                    Discussion & Actions ({comments?.length || 0})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await refetchComments();
                      setCommentDialogOpen(true);
                      setViewDialogOpen(false);
                    }}
                    className="h-8 px-3"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg border p-3 max-h-64 overflow-y-auto">
                  {comments && comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment: any, index: number) => (
                        <div key={comment.id} className="flex gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {comment.user?.firstName?.[0] || comment.user?.lastName?.[0] || 'U'}
                          </div>
                          
                          {/* Message */}
                          <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-lg p-3 shadow-sm border">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-800">
                                  {(comment.user as any)?.firstName && (comment.user as any)?.lastName 
                                    ? `${(comment.user as any).firstName} ${(comment.user as any).lastName}` 
                                    : 'Unknown User'}
                                </span>
                                {(comment.user as any)?.role && (
                                  <Badge variant={(comment.user as any).role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                    {(comment.user as any).role}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                  {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd, HH:mm') : 'Unknown'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {comment.content || 'No content'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        No discussion yet. Start the conversation with corrective actions and updates.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {/* Remove the redundant Add Comment button since it's now in the chat header */}
                {/* Status/Closure Actions - Role-based display */}
                {(user as any)?.role === 'admin' ? (
                  // Admin buttons: Can approve/reject closures and change status
                  <>
                    {selectedIncident.status === 'pending_closure' ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => approveClosureMutation.mutate(selectedIncident.id)}
                          disabled={approveClosureMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve Closure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectClosureDialogOpen(true);
                            setViewDialogOpen(false);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject Closure
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusDialogOpen(true);
                          setViewDialogOpen(false);
                        }}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Change Status
                      </Button>
                    )}
                  </>
                ) : (
                  // User button: Can request closure if not already closed/pending
                  selectedIncident.status !== 'closed' && selectedIncident.status !== 'pending_closure' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRequestClosureDialogOpen(true);
                        setViewDialogOpen(false);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Request Closure
                    </Button>
                  )
                )}
                <Button
                  variant={selectedIncident.isFlagged ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    updateIncidentMutation.mutate({
                      id: selectedIncident.id,
                      updates: { isFlagged: !selectedIncident.isFlagged }
                    });
                  }}
                  disabled={updateIncidentMutation.isPending}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {selectedIncident.isFlagged ? "Remove Flag" : "Flag Incident"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProofDialogOpen(true);
                    setViewDialogOpen(false);
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Proof
                </Button>
                {(user as any)?.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to permanently delete incident ${selectedIncident?.ovrId}?\n\nThis action cannot be undone and will remove:\n- The incident record\n- All comments and discussions\n- Related audit logs`)) {
                        deleteIncidentMutation.mutate(selectedIncident.id);
                      }
                    }}
                    disabled={deleteIncidentMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    {deleteIncidentMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Incident
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500">Loading incident details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Add to Discussion - {selectedIncident?.ovrId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment" className="text-sm font-medium">
                Your Message
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Share corrective actions, investigation notes, updates, or questions about this incident.
              </p>
              <Textarea
                id="comment"
                placeholder="Type your message here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {newComment.length}/1000 characters
                </span>
                <span className="text-xs text-gray-500">
                  {(user as any)?.firstName} {(user as any)?.lastName} • {(user as any)?.role}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCommentDialogOpen(false);
                  setNewComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedIncident && newComment.trim()) {
                    addCommentMutation.mutate({
                      incidentId: selectedIncident.id,
                      content: newComment.trim()
                    });
                  }
                }}
                disabled={!newComment.trim() || addCommentMutation.isPending || newComment.length > 1000}
                className="min-w-[100px]"
              >
                {addCommentMutation.isPending ? (
                  <>
                    <span className="mr-2">Sending...</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status - {selectedIncident?.ovrId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Status</Label>
              <div className="mt-1">
                {selectedIncident && getStatusBadge(selectedIncident.status)}
              </div>
            </div>
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  {(user as any)?.role === 'admin' && (
                    <>
                      <SelectItem value="pending_closure">Pending Closure</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedIncident && selectedStatus) {
                    updateIncidentMutation.mutate({
                      id: selectedIncident.id,
                      updates: { status: selectedStatus }
                    });
                  }
                }}
                disabled={!selectedStatus || updateIncidentMutation.isPending}
              >
                {updateIncidentMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Upload Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Supporting Evidence - {selectedIncident?.ovrId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proof">Select File</Label>
              <Input
                id="proof"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedIncident && proofFile) {
                    uploadProofMutation.mutate({
                      incidentId: selectedIncident.id,
                      file: proofFile
                    });
                  }
                }}
                disabled={!proofFile || uploadProofMutation.isPending}
              >
                {uploadProofMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Closure Dialog (for users) */}
      <Dialog open={requestClosureDialogOpen} onOpenChange={setRequestClosureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Closure - {selectedIncident?.ovrId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="closureReason">Closure Reason</Label>
              <Textarea
                id="closureReason"
                placeholder="Please provide a reason for closing this incident..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRequestClosureDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedIncident && closureReason.trim()) {
                    requestClosureMutation.mutate({
                      incidentId: selectedIncident.id,
                      reason: closureReason.trim()
                    });
                  }
                }}
                disabled={requestClosureMutation.isPending || !closureReason.trim()}
              >
                {requestClosureMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Closure Dialog (for admins) */}
      <Dialog open={rejectClosureDialogOpen} onOpenChange={setRejectClosureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Closure Request - {selectedIncident?.ovrId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please provide a reason for rejecting this closure request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setRejectClosureDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedIncident && rejectionReason.trim()) {
                    rejectClosureMutation.mutate({
                      incidentId: selectedIncident.id,
                      reason: rejectionReason.trim()
                    });
                  }
                }}
                disabled={rejectClosureMutation.isPending || !rejectionReason.trim()}
              >
                {rejectClosureMutation.isPending ? "Rejecting..." : "Reject Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit {editField === 'ovrCategory' ? 'OVR Category' : 'Incident Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editValue">
                {editField === 'ovrCategory' ? 'OVR Category' : 'What is being reported'}
              </Label>
              {editField === 'whatIsBeingReported' ? (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="mandatory_reportable_event">Mandatory Reportable Event</SelectItem>
                    <SelectItem value="sentinel_event">Sentinel Event</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="editValue"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-1"
                  placeholder="Enter category name"
                />
              )}
            </div>
            <div>
              <Label htmlFor="editComment">Reason for Change (Required)</Label>
              <Textarea
                id="editComment"
                placeholder="Please provide a reason for this change..."
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedIncident && editField && editValue.trim() && editComment.trim()) {
                    editIncidentMutation.mutate({
                      incidentId: selectedIncident.id,
                      field: editField,
                      value: editValue.trim(),
                      comment: editComment.trim()
                    });
                  }
                }}
                disabled={editIncidentMutation.isPending || !editValue.trim() || !editComment.trim()}
              >
                {editIncidentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}