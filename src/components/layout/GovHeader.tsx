import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccessPortal } from "./AccessPortal";
import reliefxLogo from "@/assets/reliefx-logo.png";

export function GovHeader() {
  return (
    <header className="w-full animate-fade-in">
      {/* Indian flag stripe */}
      <div className="gov-stripe">
        <div className="flex-1 gov-stripe-saffron" />
        <div className="flex-1 gov-stripe-white" />
        <div className="flex-1 gov-stripe-green" />
      </div>
      
      {/* Main header */}
      <div className="bg-navy-dark text-white py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <img 
                src={reliefxLogo} 
                alt="ReliefX Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">RELIFEX</h1>
              <p className="text-xs text-white/80">Emergency & Disaster Relief Platform</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-white/70 text-sm">Government of India Initiative</span>
            <ThemeToggle />
            <AccessPortal />
          </div>
        </div>
      </div>
    </header>
  );
}
