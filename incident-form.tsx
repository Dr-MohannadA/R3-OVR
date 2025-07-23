import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface Facility {
  id: number;
  nameEn: string;
  nameAr: string;
}

interface Category {
  id: number;
  name: string;
}

const incidentFormSchema = z.object({
  facilityId: z.number().min(1, "Please select a facility"),
  category: z.string().min(1, "Please select a category"),
  incidentDate: z.string().min(1, "Please select incident date"),
  incidentTime: z.string().min(1, "Please enter incident time"),
  levelOfHarm: z.enum(["no_harm", "low", "moderate", "severe", "death"]),
  description: z.string().min(10, "Please provide a detailed description"),
  isAnonymous: z.boolean().default(false),
  reporterName: z.string().optional(),
  contactInfo: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

export function IncidentForm() {
  const { toast } = useToast();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ovrId, setOvrId] = useState<string>("");

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      facilityId: 0,
      category: "",
      incidentDate: "",
      incidentTime: "",
      levelOfHarm: "no_harm",
      description: "",
      isAnonymous: false,
      reporterName: "",
      contactInfo: "",
    },
  });

  const submitIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormValues) => {
      // Find the category ID
      const category = categories?.find(c => c.name === data.category);

      if (!category) {
        throw new Error('Invalid category selection');
      }

      const payload = {
        facilityId: data.facilityId,
        categoryId: category.id,
        incidentDate: data.incidentDate,
        incidentTime: data.incidentTime,
        levelOfHarm: data.levelOfHarm,
        description: data.description,
        isAnonymous: data.isAnonymous,
        reporterName: data.isAnonymous ? "" : data.reporterName,
        contactInfo: data.isAnonymous ? "" : data.contactInfo,
      };

      const response = await apiRequest('POST', '/api/incidents/public', payload);
      return response.json();
    },
    onSuccess: (data) => {
      setOvrId(data.ovrId);
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: `Incident reported successfully. OVR ID: ${data.ovrId}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit incident report",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: IncidentFormValues) => {
    submitIncidentMutation.mutate(values);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted Successfully</h2>
          <p className="text-slate-600 mb-4">
            Your incident report has been received and assigned OVR ID: <strong>{ovrId}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Please keep this ID for your records. You can use it to track the status of your report.
          </p>
          <Button onClick={() => {
            setIsSubmitted(false);
            setOvrId("");
            form.reset();
          }}>
            Submit Another Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilities?.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id.toString()}>
                            <div>
                              <div className="font-medium">{facility.nameEn}</div>
                              <div className="text-sm text-slate-500">{facility.nameAr}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="levelOfHarm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level of Harm *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select harm level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no_harm">No Harm</SelectItem>
                      <SelectItem value="low">Low Harm</SelectItem>
                      <SelectItem value="moderate">Moderate Harm</SelectItem>
                      <SelectItem value="severe">Severe Harm</SelectItem>
                      <SelectItem value="death">Death</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Describe the incident in detail..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsAnonymous(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Submit anonymously</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="reporterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Email or phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={submitIncidentMutation.isPending}
                className="px-6 sm:px-8 w-full sm:w-auto"
              >
                {submitIncidentMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
