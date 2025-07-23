import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Filters } from "@/components/dashboard/filters";
import { IncidentsTable } from "@/components/dashboard/incidents-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  BarChart3,
  Plus,
  Users,
  Home
} from "lucide-react";

interface MetricsData {
  total: number;
  open: number;
  inReview: number;
  closed: number;
  highPriority: number;
  activeFacilities: number;
}

export default function Dashboard() {
  const { user } = useAuthSimple();
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const { data: metrics, isLoading } = useQuery<MetricsData>({
    queryKey: ['/api/incidents/metrics'],
  });

  const statusCards = [
    {
      title: "Open Incidents",
      value: metrics?.open || 0,
      description: "Requires attention",
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "In Review",
      value: metrics?.inReview || 0,
      description: "Under investigation",
      icon: Clock,
      color: "yellow",
    },
    {
      title: "Closed Incidents",
      value: metrics?.closed || 0,
      description: "Resolved",
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Total Incidents",
      value: metrics?.total || 0,
      description: "All time",
      icon: BarChart3,
      color: "gray",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header with Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm bg-white/10 text-white text-xs sm:text-sm font-medium border border-white/20">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Real-time Dashboard
              </div>
            </div>
            
            {/* Quick Action Icons */}
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-white/10 border-white/20 hover:bg-white/20">
                  <Home className="w-4 h-4 text-white" />
                </Button>
              </Link>
              <Link href="/report">
                <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-green-500/80 border-green-400/50 hover:bg-green-600/80">
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </Link>
              {(user as any)?.role === 'admin' && (
                <Link href="/user-management">
                  <Button variant="outline" size="sm" className="w-10 h-10 p-0 bg-purple-500/80 border-purple-400/50 hover:bg-purple-600/80">
                    <Users className="w-4 h-4 text-white" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
            OVR Dashboard
          </h1>
          <p className="text-sm sm:text-lg text-white/80 max-w-2xl mx-auto px-4">
            Monitor and manage incident reports across all facilities in Riyadh Third Health Cluster
          </p>
        </div>

        {/* Filters */}
        <Filters
          facilityFilter={facilityFilter}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          dateFromFilter={dateFromFilter}
          dateToFilter={dateToFilter}
          onFacilityChange={setFacilityFilter}
          onCategoryChange={setCategoryFilter}
          onStatusChange={setStatusFilter}
          onDateFromChange={setDateFromFilter}
          onDateToChange={setDateToFilter}
          onClearFilters={() => {
            setFacilityFilter("all");
            setCategoryFilter("all");
            setStatusFilter("all");
            setDateFromFilter("");
            setDateToFilter("");
          }}
        />

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statusCards.map((card, index) => {
            const IconComponent = card.icon;
            const colorClasses = {
              red: "backdrop-blur-sm bg-white/20 text-red-100 border-white/30",
              yellow: "backdrop-blur-sm bg-white/20 text-amber-100 border-white/30",
              green: "backdrop-blur-sm bg-white/20 text-emerald-100 border-white/30",
              gray: "backdrop-blur-sm bg-white/20 text-white border-white/30",
            }[card.color];

            if (isLoading) {
              return (
                <Card key={index} className="animate-pulse border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded-lg w-24"></div>
                        <div className="h-8 bg-muted rounded-lg w-16"></div>
                        <div className="h-3 bg-muted rounded-lg w-20"></div>
                      </div>
                      <div className="w-14 h-14 bg-muted rounded-xl"></div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={index} className="card-hover border-0 shadow-lg backdrop-blur-sm bg-white/10 border-white/20">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{card.title}</p>
                      <p className={`text-xl sm:text-3xl font-bold ${
                        card.color === 'red' ? 'text-red-600' :
                        card.color === 'yellow' ? 'text-amber-600' :
                        card.color === 'green' ? 'text-emerald-600' :
                        'text-slate-700'
                      }`}>
                        {card.value.toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:block">{card.description}</p>
                    </div>
                    <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-sm ${colorClasses}`}>
                      <IconComponent className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Incidents Table */}
        <IncidentsTable
          facilityFilter={facilityFilter}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          dateFromFilter={dateFromFilter}
          dateToFilter={dateToFilter}
        />
      </div>
    </div>
  );
}
