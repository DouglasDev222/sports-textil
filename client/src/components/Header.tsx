import { Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Eventos" },
    { path: "/minhas-inscricoes", label: "Minhas Inscrições" },
    { path: "/minha-conta", label: "Minha Conta" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-primary-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 hover-elevate rounded-md px-3 py-2">
            <div className="text-primary-foreground font-bold text-xl tracking-tight">
              ST Eventos
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`text-primary-foreground ${
                    isActive(item.path) ? "bg-primary-foreground/10" : ""
                  }`}
                  data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/login">
              <Button
                size="icon"
                variant="ghost"
                className="text-primary-foreground"
                data-testid="button-user-menu"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </nav>

          <Button
            size="icon"
            variant="ghost"
            className="md:hidden text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-primary-foreground ${
                    isActive(item.path) ? "bg-primary-foreground/10" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/login">
              <Button
                variant="ghost"
                className="w-full justify-start text-primary-foreground"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="button-mobile-login"
              >
                <User className="h-5 w-5 mr-2" />
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
