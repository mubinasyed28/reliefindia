import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  LogIn, 
  UserCog, 
  Building2, 
  Store, 
  Users,
  UserPlus
} from "lucide-react";

export function AccessPortal() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-saffron hover:bg-saffron/90 text-white font-semibold shadow-lg"
          size="sm"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Access Portal
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Login
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/auth/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <UserCog className="w-4 h-4 text-destructive" />
            <span>Admin Login</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/auth/ngo" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Building2 className="w-4 h-4 text-primary" />
            <span>NGO Login</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/auth/merchant" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Store className="w-4 h-4 text-green-600" />
            <span>Merchant Login</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/auth/citizen" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Users className="w-4 h-4 text-saffron" />
            <span>Citizen Login</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Register
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/ngo/register" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <UserPlus className="w-4 h-4 text-primary" />
            <span>NGO Register</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/merchant/register" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <UserPlus className="w-4 h-4 text-green-600" />
            <span>Merchant Register</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/auth/citizen" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <UserPlus className="w-4 h-4 text-saffron" />
            <span>Citizen Signup</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
