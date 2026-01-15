import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";
import NGORegister from "./pages/ngo/NGORegister";
import MerchantRegister from "./pages/merchant/MerchantRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDisasters from "./pages/admin/AdminDisasters";
import AdminBillReview from "./pages/admin/AdminBillReview";
import AdminMapView from "./pages/admin/AdminMapView";
import AdminComplaints from "./pages/admin/AdminComplaints";
import TransactionExplorer from "./pages/admin/TransactionExplorer";
import AdminNGOs from "./pages/admin/AdminNGOs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminGrievances from "./pages/admin/AdminGrievances";
import AdminMerchants from "./pages/admin/AdminMerchants";
import AdminBeneficiaries from "./pages/admin/AdminBeneficiaries";
import AdminDistributeFunds from "./pages/admin/AdminDistributeFunds";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminAPIManagement from "./pages/admin/AdminAPIManagement";
import AdminDuplicateClaims from "./pages/admin/AdminDuplicateClaims";
import AdminDonations from "./pages/admin/AdminDonations";
import NGOPublicProfile from "./pages/public/NGOPublicProfile";
import TeamPage from "./pages/public/TeamPage";
import ServicesPage from "./pages/public/ServicesPage";
import AccessPage from "./pages/public/AccessPage";
import DonorsPage from "./pages/public/DonorsPage";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import QRCodePage from "./pages/citizen/QRCodePage";
import TransactionsPage from "./pages/citizen/TransactionsPage";
import ComplaintsPage from "./pages/citizen/ComplaintsPage";
import NGODashboard from "./pages/ngo/NGODashboard";
import BillUploadPage from "./pages/ngo/BillUploadPage";
import NGOIssueFunds from "./pages/ngo/NGOIssueFunds";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import AcceptPayment from "./pages/merchant/AcceptPayment";
import MerchantTransactionsPage from "./pages/merchant/TransactionsPage";
import OfflineSync from "./pages/merchant/OfflineSync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/donors" element={<DonorsPage />} />
            <Route path="/ngo/:id" element={<NGOPublicProfile />} />
            
            {/* Auth Routes */}
            <Route path="/auth/:role" element={<AuthPage />} />
            
            {/* Registration Routes */}
            <Route path="/ngo/register" element={<NGORegister />} />
            <Route path="/merchant/register" element={<MerchantRegister />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/donations" element={<AdminDonations />} />
            <Route path="/admin/distribute" element={<AdminDistributeFunds />} />
            <Route path="/admin/settlements" element={<AdminSettlements />} />
            <Route path="/admin/disasters" element={<AdminDisasters />} />
            <Route path="/admin/bills" element={<AdminBillReview />} />
            <Route path="/admin/complaints" element={<AdminGrievances />} />
            <Route path="/admin/grievances" element={<AdminGrievances />} />
            <Route path="/admin/transactions" element={<TransactionExplorer />} />
            <Route path="/admin/ngos" element={<AdminNGOs />} />
            <Route path="/admin/merchants" element={<AdminMerchants />} />
            <Route path="/admin/beneficiaries" element={<AdminBeneficiaries />} />
            <Route path="/admin/map" element={<AdminMapView />} />
            <Route path="/admin/audit" element={<TransactionExplorer />} />
            <Route path="/admin/api" element={<AdminAPIManagement />} />
            <Route path="/admin/duplicate-claims" element={<AdminDuplicateClaims />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Citizen Routes */}
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/citizen/qr" element={<QRCodePage />} />
            <Route path="/citizen/transactions" element={<TransactionsPage />} />
            <Route path="/citizen/merchants" element={<CitizenDashboard />} />
            <Route path="/citizen/complaints" element={<ComplaintsPage />} />
            <Route path="/citizen/profile" element={<CitizenDashboard />} />
            
            {/* NGO Routes */}
            <Route path="/ngo" element={<NGODashboard />} />
            <Route path="/ngo/issue-funds" element={<NGOIssueFunds />} />
            <Route path="/ngo/spending" element={<NGODashboard />} />
            <Route path="/ngo/beneficiaries" element={<NGODashboard />} />
            <Route path="/ngo/reports" element={<NGODashboard />} />
            <Route path="/ngo/bill-upload" element={<BillUploadPage />} />
            <Route path="/ngo/profile" element={<NGODashboard />} />
            
            {/* Merchant Routes */}
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/merchant/accept" element={<AcceptPayment />} />
            <Route path="/merchant/transactions" element={<MerchantTransactionsPage />} />
            <Route path="/merchant/offline" element={<OfflineSync />} />
            <Route path="/merchant/profile" element={<MerchantDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
