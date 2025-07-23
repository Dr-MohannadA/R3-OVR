import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function useAuthSimple() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        queryClient.setQueryData(["/api/auth/user"], userData);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        queryClient.setQueryData(["/api/auth/user"], null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Only check auth once on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    refetch: checkAuth
  };
}