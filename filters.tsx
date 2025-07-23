import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Calendar, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface Facility {
  id: number;
  nameEn: string;
  nameAr: string;
  code: string;
}

interface Category {
  id: number;
  name: string;
}

interface FiltersProps {
  facilityFilter: string;
  categoryFilter: string;
  statusFilter: string;
  dateFromFilter: string;
  dateToFilter: string;
  onFacilityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
}

export function Filters({
  facilityFilter,
  categoryFilter,
  statusFilter,
  dateFromFilter,
  dateToFilter,
  onFacilityChange,
  onCategoryChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: FiltersProps) {
  const { user } = useAuth();
  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  return (
    <Card className="shadow-sm border border-slate-200 mb-6 sm:mb-8">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-slate-900">Filters</h3>
        </div>
        <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${user?.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} md:grid-cols-2`}>
          {/* Only show facility filter for admins */}
          {user?.role === 'admin' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                Facility
              </label>
              <Select value={facilityFilter} onValueChange={onFacilityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities?.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id.toString()}>
                      {facility.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="pending_closure">Pending Closure</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date From Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Date From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="pl-10"
                placeholder="Select start date"
              />
            </div>
          </div>
          
          {/* Date To Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Date To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => onDateToChange(e.target.value)}
                className="pl-10"
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(facilityFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || dateFromFilter || dateToFilter) && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
