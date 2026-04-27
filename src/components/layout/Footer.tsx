import { Link, useNavigate, useLocation } from "react-router-dom";
import { Instagram, Mail, Heart } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { SUPPORT_EMAIL } from "@/lib/config";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  const footerLinks = {
    product: [
      { name: "Features", scroll: "features" },
      { name: "Pricing", scroll: "pricing" },
      { name: "Templates", href: "/templates" },
      { name: "Dashboard", href: "/dashboard" },
    ] as { name: string; href?: string; scroll?: string }[],
    company: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Refund Policy", href: "/refund" },
      // { name: "Shipping Policy", href: "/shipping" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: null, label: "Instagram" },
    { icon: Mail, href: `mailto:${SUPPORT_EMAIL}`, label: "Email" },
  ];

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <AppLogo />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Transform your long-form content into viral clips with AI-powered video editing.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) =>
                social.href ? (
                  <a
                    key={social.label}
                    href={social.href}
                    className="p-2 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ) : (
                  <span
                    key={social.label}
                    className="p-2 rounded-lg bg-muted text-muted-foreground/40 cursor-not-allowed"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </span>
                )
              )}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  {link.scroll ? (
                    <button
                      onClick={() => scrollToSection(link.scroll!)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link to={link.href!} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('/') ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} Clip on Fly. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for content creators
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
