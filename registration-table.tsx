import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Clock, User } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Registration {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  facilityId: number;
  position: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
  facility?: {
    nameEn: string;
    nameAr: string;
  };
}

interface RegistrationTableProps {
  registrations: Registration[];
}

export function RegistrationTable({ registrations }: RegistrationTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/admin/registrations/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Registration Approved",
        description: "User account has been created successfully",
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
        description: "Failed to approve registration",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await apiRequest('POST', `/api/admin/registrations/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/registrations'] });
      toast({
        title: "Registration Rejected",
        description: "Registration request has been declined",
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
        description: "Failed to reject registration",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-slate-600" />
          <div>
            <CardTitle>Registration Requests</CardTitle>
            <p className="text-sm text-slate-600">Review and manage user registration requests</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No registration requests found
                  </TableCell>
                </TableRow>
              ) : (
                registrations?.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.firstName} {registration.lastName}
                    </TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.facility?.nameEn}</div>
                        <div className="text-sm text-slate-500">{registration.facility?.nameAr}</div>
                      </div>
                    </TableCell>
                    <TableCell>{registration.position}</TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {registration.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(registration.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate({ 
                              id: registration.id, 
                              reason: "Application declined by administrator" 
                            })}
                            disabled={rejectMutation.isPending}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">
                          {registration.status === 'approved' ? 'Account Created' : 'Declined'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}