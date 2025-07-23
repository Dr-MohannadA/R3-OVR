import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { HHCLogo } from "@/components/layout/logo";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import { 
  FileText, 
  Zap, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Plus,
  BarChart3,
  Building2
} from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuthSimple();

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Hero Section */}
      <section className="text-white py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Occurrence Variance<br />
            <span className="text-white/90">Reporting System</span>
          </h1>
          <p className="text-base sm:text-xl mb-8 sm:mb-10 opacity-90 max-w-2xl mx-auto px-4">
            Report incidents, track progress, and improve patient safety across our healthcare cluster with our comprehensive OVR system
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/report">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg button-hover font-semibold px-6 sm:px-8 w-full sm:w-auto">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Report Incident
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/register">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm bg-white/10 font-semibold px-6 sm:px-8 button-hover w-full sm:w-auto"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Register Account
                </Button>
              </Link>
            )}
            <Link href={isAuthenticated ? '/dashboard' : '/login'}>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm bg-white/10 font-semibold px-6 sm:px-8 button-hover w-full sm:w-auto"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {isAuthenticated ? 'View Dashboard' : 'Staff Login'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Info Section instead of metrics for unauthenticated users */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Hospitals</p>
                  <p className="text-2xl font-bold text-white">14</p>
                  <p className="text-xs text-white/60">Healthcare Facilities</p>
                </div>
                <Building2 className="w-12 h-12 text-blue-300" />
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">24/7</p>
                  <p className="text-2xl font-bold text-white">Available</p>
                  <p className="text-xs text-white/60">Report Anytime</p>
                </div>
                <FileText className="w-12 h-12 text-green-300" />
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Anonymous</p>
                  <p className="text-2xl font-bold text-white">Supported</p>
                  <p className="text-xs text-white/60">Optional Identity</p>
                </div>
                <Shield className="w-12 h-12 text-orange-300" />
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Fast</p>
                  <p className="text-2xl font-bold text-white">Response</p>
                  <p className="text-xs text-white/60">Quick Processing</p>
                </div>
                <Zap className="w-12 h-12 text-red-300" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Easy Reporting */}
          <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-8">
            <div className="w-12 h-12 backdrop-blur-sm bg-white/20 border-white/30 rounded-lg flex items-center justify-center mb-6 border">
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Easy Reporting</h3>
            <p className="text-white/80 mb-6">
              Submit incident reports quickly and securely with our user-friendly form
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Anonymous reporting supported
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                QR code access from any location
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Mobile-friendly interface
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Automatic OVR ID generation
              </li>
            </ul>
          </div>

          {/* Real-time Tracking */}
          <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-8">
            <div className="w-12 h-12 backdrop-blur-sm bg-white/20 border-white/30 rounded-lg flex items-center justify-center mb-6 border">
              <Zap className="w-6 h-6 text-green-200" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Real-time Tracking</h3>
            <p className="text-white/80 mb-6">
              Monitor incident status with color-coded badges and comprehensive dashboards
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Red badges for open incidents
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Green badges for closed cases
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Role-based access control
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Facility-specific views
              </li>
            </ul>
          </div>

          {/* Secure & Compliant */}
          <div className="backdrop-blur-sm bg-white/10 border-white/20 rounded-xl shadow-sm border p-8">
            <div className="w-12 h-12 backdrop-blur-sm bg-white/20 border-white/30 rounded-lg flex items-center justify-center mb-6 border">
              <Shield className="w-6 h-6 text-purple-200" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Staff Access & Security</h3>
            <p className="text-white/80 mb-6">
              Healthcare staff can register for dashboard access with admin approval and secure authentication
            </p>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Staff registration with approval workflow
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Secure authentication system
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Role-based dashboard access
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                Full audit trail compliance
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="backdrop-blur-sm bg-white/5 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 backdrop-blur-sm bg-white/20 border-white/30 rounded-lg flex items-center justify-center border">
              <HHCLogo className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/70">
                Riyadh Third Health Cluster - Healthcare Excellence Through Safety
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
