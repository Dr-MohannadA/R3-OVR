import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Plus, 
  Users, 
  ClipboardList,
  TrendingUp,
  Activity,
  Building2
} from "lucide-react";

interface MetricsData {
  total: number;
  open: number;
  inReview: number;
  closed: number;
  highPriority: number;
  activeFacilities: number;
}

export default function Home() {
  const { user } = useAuthSimple();
  
  const { data: metrics } = useQuery<MetricsData>({
    queryKey: ['/api/incidents/metrics'],
  });

  const quickActions = [
    {
      title: "Dashboard",
      description: "View incident metrics and reports",
      href: "/dashboard",
      icon: BarChart3,
      color: "blue",
    },
    {
      title: "Report Incident", 
      description: "Submit a new incident report",
      href: "/report",
      icon: Plus,
      color: "green",
    },
  ];

if ((user as any)?.role === 'admin') {
    quickActions.push({
      title: "User Management",
      description: "Manage users and permissions",
      href: "/user-management", 
      icon: Users,
      color: "purple",
    });
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-6 shadow-lg">
            <Activity className="w-4 h-4 mr-2" />
{(user as any)?.role === 'admin' ? 'System Administrator' : 'Healthcare Professional'}
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
Welcome back, <span className="text-yellow-300">{(user as any)?.firstName || 'User'}</span>
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
{(user as any)?.facility ? `${(user as any).facility} • ` : 'All Facilities • '}Ready to make healthcare safer
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const iconBgClasses = {
              blue: "bg-blue-500",
              green: "bg-green-500", 
              purple: "bg-purple-500",
            }[action.color];

            return (
              <Link key={index} href={action.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconBgClasses}`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* System Overview */}
        <div className="backdrop-blur-md bg-white/95 rounded-2xl shadow-2xl border border-white/50 p-8">
          <div className="flex items-center mb-8">
            <Activity className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
              <ClipboardList className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-blue-900 mb-1">{metrics?.total || 0}</p>
              <p className="text-blue-700 font-medium">Total Incidents</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-red-900 mb-1">{metrics?.open || 0}</p>
              <p className="text-red-700 font-medium">Open Cases</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
              <Activity className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-green-900 mb-1">{metrics?.closed || 0}</p>
              <p className="text-green-700 font-medium">Resolved Cases</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow">
              <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <p className="text-3xl font-bold text-purple-900 mb-1">{metrics?.activeFacilities || 14}</p>
              <p className="text-purple-700 font-medium">Active Facilities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
