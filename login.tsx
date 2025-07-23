import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { HHCLogo } from "@/components/layout/logo";
import hhcLogo from "@/assets/hhc-logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return await response.json();
    },
    onSuccess: async (data) => {
      // Set user data in cache
      queryClient.setQueryData(["/api/auth/user"], data.user);
      
      // Invalidate queries to refresh auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Login Successful",
        description: "Welcome to the OVR System",
      });
      
      // Use a slight delay to ensure session is properly established
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="p-4 sm:p-8">
          <div className="text-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4 button-hover">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 p-3">
              <img 
                src={hhcLogo} 
                alt="HHC Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sign In to OVR System
            </h1>
            <p className="text-muted-foreground text-lg">
              Enter your credentials to access the system
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="your.email@example.com"
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <div className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}