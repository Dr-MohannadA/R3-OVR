import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  MessageSquare, 
  Flag, 
  Clock, 
  MapPin, 
  Tag, 
  Calendar,
  User,
  FileText,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

interface IncidentWithRelations {
  id: number;
  ovrId: string;
  facilityId: number;
  categoryId: number;
  incidentDate: string;
  incidentTime: string;
  description: string;
  levelOfHarm: string;
  status: string;
  priority: string;
  isAnonymous: boolean;
  reporterName?: string;
  contactInfo?: string;
  reportedById?: string;
  assignedToId?: string;
  isFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: number;
    nameEn: string;
    nameAr: string;
    code: string;
  };
  category: {
    id: number;
    name: string;
  };
  comments?: Array<{
    id: number;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }>;
}

export default function IncidentDetail() {
  const [, params] = useRoute("/incident/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState("");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const incidentId = params?.id ? parseInt(params.id) : null;

  const { data: incident, isLoading } = useQuery<IncidentWithRelations>({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', `/api/incidents/${incidentId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', incidentId] });
      setNewComment("");
      setCommentDialogOpen(false);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ updates }: { updates: any }) => {
      await apiRequest('PATCH', `/api/incidents/${incidentId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents/metrics'] });
      setStatusDialogOpen(false);
      toast({
        title: "Success",
        description: "Incident updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('proof', file);
      const response = await fetch(`/api/incidents/${incidentId}/proof`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload proof');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', incidentId] });
      setProofDialogOpen(false);
      setProofFile(null);
      toast({
        title: "Success",
        description: "Proof uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload proof",
        variant: "destructive",
      });
    },
  });

  const handleToggleFlag = () => {
    updateIncidentMutation.mutate({
      updates: { isFlagged: !incident?.isFlagged }
    });
  };

  const handleStatusChange = () => {
    if (selectedStatus) {
      updateIncidentMutation.mutate({
        updates: { status: selectedStatus }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      under_review: "secondary", 
      reviewed: "default",
      closed: "outline",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "default", 
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || "outline"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getLevelOfHarmBadge = (level: string) => {
    const variants = {
      no_harm: "default",
      low: "secondary",
      moderate: "secondary",
      severe: "destructive",
      death: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || "outline"}>
        {level.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading || !incident) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="backdrop-blur-sm bg-white/20 border-white/30">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-white/20 rounded w-1/3"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/20 rounded"></div>
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Status options based on user role
  const getStatusOptions = () => {
    const baseOptions = [
      { value: "open", label: "Open" },
      { value: "under_review", label: "Under Review" },
      { value: "reviewed", label: "Reviewed" },
    ];
    
    if (user?.role === 'admin') {
      baseOptions.push({ value: "closed", label: "Closed" });
    }
    
    return baseOptions;
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 text-white hover:bg-white/10"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Incident Header */}
        <Card className="backdrop-blur-sm bg-white/20 border-white/30 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  Incident Details - {incident.ovrId}
                  {incident.isFlagged && (
                    <Badge variant="destructive" className="ml-2">
                      <Flag className="w-3 h-3 mr-1" />
                      FLAGGED
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-white/70 mt-1">
                  Reported on {format(new Date(incident.createdAt), 'PPP')}
                </p>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(incident.status)}
                {getPriorityBadge(incident.priority)}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Incident Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="backdrop-blur-sm bg-white/20 border-white/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Incident Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Facility</Label>
                    <p className="text-white">{incident.facility?.nameEn}</p>
                    <p className="text-white/70 text-sm">{incident.facility?.nameAr}</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Category</Label>
                    <p className="text-white">{incident.category?.name}</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Date & Time</Label>
                    <p className="text-white">
                      {format(new Date(incident.incidentDate), 'PPP')} at {incident.incidentTime}
                    </p>
                  </div>
                  <div>
                    <Label className="text-white/80">Level of Harm</Label>
                    <div className="mt-1">
                      {getLevelOfHarmBadge(incident.levelOfHarm)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-white/80">Description</Label>
                  <div className="mt-2 p-3 rounded-lg bg-white/10 border border-white/20">
                    <p className="text-white whitespace-pre-wrap">{incident.description}</p>
                  </div>
                </div>

                {!incident.isAnonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80">Reporter Name</Label>
                      <p className="text-white">{incident.reporterName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-white/80">Contact Info</Label>
                      <p className="text-white">{incident.contactInfo || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="backdrop-blur-sm bg-white/20 border-white/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Comments ({incident.comments?.length || 0})
                  </CardTitle>
                  <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Add Comment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="comment">Comment</Label>
                          <Textarea
                            id="comment"
                            placeholder="Enter your comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => addCommentMutation.mutate(newComment)}
                            disabled={!newComment.trim() || addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {incident.comments && incident.comments.length > 0 ? (
                  <div className="space-y-4">
                    {incident.comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg bg-white/10 border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{comment.authorName}</span>
                          <span className="text-white/60 text-sm">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-4">No comments yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card className="backdrop-blur-sm bg-white/20 border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Flag Toggle */}
                <Button
                  variant={incident.isFlagged ? "destructive" : "outline"}
                  className="w-full"
                  onClick={handleToggleFlag}
                  disabled={updateIncidentMutation.isPending}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {incident.isFlagged ? "Remove Flag" : "Flag Incident"}
                </Button>

                {/* Status Change */}
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                      <Clock className="w-4 h-4 mr-2" />
                      Change Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Incident Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Current Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(incident.status)}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="status">New Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            {getStatusOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleStatusChange}
                          disabled={!selectedStatus || updateIncidentMutation.isPending}
                        >
                          {updateIncidentMutation.isPending ? "Updating..." : "Update Status"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Upload Proof */}
                <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Supporting Evidence</DialogTitle>
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
                          onClick={() => proofFile && uploadProofMutation.mutate(proofFile)}
                          disabled={!proofFile || uploadProofMutation.isPending}
                        >
                          {uploadProofMutation.isPending ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="backdrop-blur-sm bg-white/20 border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-white/80">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{incident.facility?.code}</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Tag className="w-4 h-4 mr-2" />
                  <span className="text-sm">{incident.category?.name}</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Created {format(new Date(incident.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                {incident.updatedAt !== incident.createdAt && (
                  <div className="flex items-center text-white/80">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Updated {format(new Date(incident.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}