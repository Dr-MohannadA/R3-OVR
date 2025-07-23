import { Header } from "@/components/layout/header";
import { ComprehensiveIncidentForm } from "@/components/forms/comprehensive-incident-form";
import { HHCLogo } from "@/components/layout/logo";
import hhcLogo from "@/assets/hhc-logo.png";

export default function ReportIncident() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header with HHC Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 backdrop-blur-sm bg-white/20 border-white/30 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 p-2 sm:p-3 border">
            <img 
              src={hhcLogo} 
              alt="HHC Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-white mb-2">تجمع الرياض الصحي الثالث</h1>
          <h2 className="text-base sm:text-xl font-semibold text-white/90 mb-2">Riyadh Third Health Cluster</h2>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Occurrence Variance Report</h3>
          <p className="text-sm sm:text-base text-white/70">Public incident reporting system - No login required</p>
        </div>

        {/* Report Form */}
        <ComprehensiveIncidentForm />
      </div>
    </div>
  );
}
