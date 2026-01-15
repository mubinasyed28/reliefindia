import { Shield, ExternalLink, Phone, Mail, MapPin, FileText, HelpCircle, Scale, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function GovFooter() {
  return (
    <footer className="w-full bg-navy-dark text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4 group cursor-pointer">
              <Shield className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
              <span className="font-bold text-lg">RELIFEX</span>
            </div>
            <p className="text-sm text-white/70 mb-4">
              A blockchain-based disaster relief distribution platform by the Government of India, 
              ensuring transparency and accountability in fund management.
            </p>
            <p className="text-xs text-white/50">
              Ministry of Home Affairs<br />
              Government of India
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="animate-fade-in animate-delay-100">
            <h4 className="font-semibold mb-4 text-saffron">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link to="/" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <FileText className="w-3 h-3" />
                  About RELIFEX
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <HelpCircle className="w-3 h-3" />
                  Public Services
                </Link>
              </li>
              <li>
                <Link to="/donors" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <Heart className="w-3 h-3" />
                  Donor Wall
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <Mail className="w-3 h-3" />
                  Team & Developers
                </Link>
              </li>
              <li>
                <Link to="/access" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  Access Portal
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="animate-fade-in animate-delay-200">
            <h4 className="font-semibold mb-4 text-saffron">Legal Framework</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a href="#" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <Scale className="w-3 h-3" />
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  <BookOpen className="w-3 h-3" />
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  Disclaimer
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-1">
                  Accessibility Statement
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact & Help */}
          <div className="animate-fade-in animate-delay-300">
            <h4 className="font-semibold mb-4 text-saffron">Help & Support</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-green-india" />
                <div>
                  <p className="text-white">Toll Free: 1800-XXX-XXXX</p>
                  <p className="text-xs">(24x7 Support)</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-green-india" />
                <div>
                  <p className="text-white">support@relifex.gov.in</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-green-india" />
                <div>
                  <p className="text-xs">
                    National Disaster Management Authority<br />
                    NDMA Bhawan, A-1, Safdarjung Enclave<br />
                    New Delhi - 110029
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-white/60">
          <p>© 2024-2026 RELIFEX - Government of India. All Rights Reserved.</p>
          <p className="mt-1">Developed under Digital India Initiative | National Informatics Centre</p>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <span>Last Updated: January 2026</span>
            <span>|</span>
            <span>Version 2.0</span>
            <span>|</span>
            <a href="#" className="hover:text-white">Site Map</a>
          </div>
        </div>
      </div>
      
      {/* Bottom stripe */}
      <div className="gov-stripe">
        <div className="flex-1 gov-stripe-saffron" />
        <div className="flex-1 gov-stripe-white" />
        <div className="flex-1 gov-stripe-green" />
      </div>
    </footer>
  );
}
