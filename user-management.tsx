import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { UserTable } from "@/components/user-management/user-table";
import { RegistrationTable } from "@/components/user-management/registration-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Shield,
  Mail,
  UserPlus,
  Plus,
  BarChart3,
  Home
} from "lucide-react";

interface UserWithStats {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  facility?: {
    id: number;
    nameEn: string;
    nameAr: string;
    code: string;
  };
  position?: string;
  isActive: boolean;
  totalIncidents?: number;
}

interface UserRegistration {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  facilityId: number;
  position: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  rejectionReason?: string;
  facility?: {
    id: number;
    nameEn: string;
    nameAr: string;
  };
}

export default function UserManagement() {
  const { user } = useAuthSimple();
  const { toast } = useToast();

  // Redirect if not admin
  useEffect(() => {
    if (user && (user as any).role !== 'admin') {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      window.location.href = '/';
    }
  }, [user, toast]);

  const { data: users, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ['/api/users'],
    enabled: (user as any)?.role === 'admin',
  });

  const { data: registrations, isLoading: registrationsLoading } = useQuery<UserRegistration[]>({
    queryKey: ['/api/admin/registrations'],
    enabled: (user as any)?.role === 'admin',
  });

  const userMetrics = {
    total: users?.length || 0,
    active: users?.filter(u => u.isActive)?.length || 0,
    pending: registrations?.filter(r => r.status === 'pending')?.length || 0,
    admins: users?.filter(u => u.role === 'admin')?.length || 0,
  };

  const metricsCards = [
    {
      title: "Total Users",
      value: userMetrics.total,
      icon: Users,
      color: "blue",
    },
    {
      title: "Active Users",
      value: userMetrics.active,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Pending Users",
      value: userMetrics.pending,
      icon: Clock,
      color: "yellow",
    },
    {
      title: "Admins",
      value: userMetrics.admins,
      icon: Shield,
      color: "purple",
    },
  ];

  if ((user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Unauthorized</h1>
            <p className="text-slate-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <div className="inline-flex items-center px-4 py-2 rounded-full backdrop-blur-sm bg-white/10 text-white text-sm font-medium border border-white/20">
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </div>
            </div>
            
            {/* Quick Action Icons */}
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-white/10 border-white/20 hover:bg-white/20">
                  <Home className="w-4 h-4 text-white" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-blue-500/80 border-blue-400/50 hover:bg-blue-600/80">
                  <BarChart3 className="w-4 h-4 text-white" />
                </Button>
              </Link>
              <Link href="/report">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-green-500/80 border-green-400/50 hover:bg-green-600/80">
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              User Management
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Manage user accounts, registration requests, and system access
            </p>
          </div>
        </div>

        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricsCards.map((metric, index) => {
            const IconComponent = metric.icon;
            const colorClasses = {
              blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200",
              green: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-200",
              yellow: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 border-amber-200", 
              purple: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200",
            }[metric.color];

            if (isLoading) {
              return (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                      </div>
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={index} className="card-hover border-0 shadow-lg backdrop-blur-sm bg-white/90">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{metric.title}</p>
                      <p className="text-3xl font-bold text-slate-700">{metric.value}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${colorClasses}`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Active Users
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Registration Requests
              {userMetrics.pending > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {userMetrics.pending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {users && <UserTable users={users} />}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6">
            {registrations && <RegistrationTable registrations={registrations} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
