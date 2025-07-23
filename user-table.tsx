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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { isUnauthorizedError } from "@/lib/authUtils";

interface UserWithStats {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  facility?: {
    id: number;
    nameEn: string;
    nameAr: string;
    code: string;
  };
  position?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalIncidents?: number;
}

interface Facility {
  id: number;
  nameEn: string;
  nameAr: string;
  code: string;
}

interface UserTableProps {
  users: UserWithStats[];
}

export function UserTable({ users }: UserTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest('PATCH', `/api/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "User updated successfully",
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
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
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
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "default",
      user: "secondary",
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {role.toUpperCase()}
      </Badge>
    );
  };



  return (
    <>
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Directory</CardTitle>
            <p className="text-sm text-slate-600">Manage user accounts and access levels</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                Users will be automatically added when they first sign in with Replit Auth.
                Use the edit function to assign roles and facilities to existing users.
              </p>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.facility?.nameEn || "N/A"}</TableCell>
                      <TableCell>{user.position || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input 
                    value={selectedUser.firstName || ""} 
                    onChange={(e) => 
                      setSelectedUser({ ...selectedUser, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    value={selectedUser.lastName || ""} 
                    onChange={(e) => 
                      setSelectedUser({ ...selectedUser, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => 
                    setSelectedUser({ ...selectedUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Facility</Label>
                <Select 
                  value={selectedUser.facility?.id?.toString() || ""} 
                  onValueChange={(value) => {
                    const facilityObj = facilities?.find(f => f.id.toString() === value);
                    setSelectedUser({ 
                      ...selectedUser, 
                      facility: facilityObj ? {
                        id: facilityObj.id,
                        nameEn: facilityObj.nameEn,
                        nameAr: facilityObj.nameAr,
                        code: facilityObj.code
                      } : undefined
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {facilities?.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id.toString()}>
                        {facility.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Input 
                  value={selectedUser.position || ""} 
                  onChange={(e) => 
                    setSelectedUser({ ...selectedUser, position: e.target.value })
                  }
                  placeholder="Job position"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedUser.isActive ? "active" : "inactive"} 
                  onValueChange={(value) => 
                    setSelectedUser({ ...selectedUser, isActive: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateUserMutation.mutate({
                      id: selectedUser.id,
                      updates: {
                        firstName: selectedUser.firstName,
                        lastName: selectedUser.lastName,
                        role: selectedUser.role,
                        facility: selectedUser.facility,
                        position: selectedUser.position,
                        isActive: selectedUser.isActive,
                      }
                    });
                  }}
                  disabled={updateUserMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
