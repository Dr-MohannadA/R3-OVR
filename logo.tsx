import hhcLogoPath from "@assets/HHC logo_1752916481318.png";

export function HHCLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`${className} bg-white rounded-sm flex items-center justify-center p-1`}>
      <img 
        src={hhcLogoPath} 
        alt="HHC Logo" 
        className="w-full h-full"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
