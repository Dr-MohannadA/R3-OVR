import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  AlertTriangle, 
  Zap, 
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

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<MetricsData>({
    queryKey: ['/api/incidents/metrics'],
  });

  const metricsData = [
    {
      label: "Total Reports",
      value: metrics?.total || 0,
      change: "+22%",
      icon: FileText,
      color: "blue",
    },
    {
      label: "Open Incidents", 
      value: metrics?.open || 0,
      change: "-5%",
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "High Priority",
      value: metrics?.highPriority || 0, 
      change: "+25%",
      icon: Zap,
      color: "orange",
    },
    {
      label: "Active Facilities",
      value: metrics?.activeFacilities || 0,
      change: "0%",
      icon: Building2,
      color: "green",
    },
  ];

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-8 bg-slate-200 rounded w-16"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric, index) => {
          const IconComponent = metric.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            red: "bg-red-50 text-red-600", 
            orange: "bg-orange-50 text-orange-600",
            green: "bg-green-50 text-green-600",
          }[metric.color];

          return (
            <Card key={index} className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{metric.value}</p>
                    <p className={`text-sm mt-1 ${
                      metric.change.startsWith('+') ? 'text-green-600' : 
                      metric.change.startsWith('-') ? 'text-red-600' : 
                      'text-slate-500'
                    }`}>
                      {metric.change} from last month
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
