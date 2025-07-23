import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserRegistrationSchema, type InsertUserRegistration, type Facility } from "@shared/schema";
import { HHCLogo } from "@/components/layout/logo";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Register() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const form = useForm<InsertUserRegistration>({
    resolver: zodResolver(insertUserRegistrationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      facilityId: 0,
      position: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUserRegistration) => {
      return await apiRequest('POST', '/api/auth/register', data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Submitted",
        description: "Your registration request has been submitted. Please wait for admin approval.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUserRegistration) => {
    registerMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-3 sm:p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 sm:p-8 text-center">
            <div className="mb-6">
              <HHCLogo className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Registration Submitted
              </h1>
              <p className="text-slate-600">
                Your registration request has been submitted successfully. 
                You will receive access once an administrator approves your request.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-3 sm:mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <HHCLogo className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Register for OVR System
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Riyadh Third Health Cluster
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="First name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Last name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Healthcare Facility</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                      disabled={facilitiesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={facilitiesLoading ? "Loading facilities..." : "Select your facility"} />
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

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position/Role</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Nurse, Doctor, Safety Officer"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Create a secure password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}