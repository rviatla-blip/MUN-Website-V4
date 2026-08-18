import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import awsmunLogo from '../../public/image.png';

export type Page = 'home' | 'committees' | 'register';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { page: Page; label: string }[] = [
    { page: 'home', label: 'Home' },
    { page: 'committees', label: 'Committees' },
    { page: 'register', label: 'Register' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white text-corporate-950 sticky top-0 z-50 shadow-sm border-b border-corporate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <img src={awsmunLogo} alt="AWSMUN Logo" className="w-10 h-10 rounded-full object-cover" />
              <div className="hidden sm:block">
                <span className="font-serif text-xl font-semibold tracking-tight text-corporate-950">AWSMUN</span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-corporate-950 text-white'
                      : 'text-corporate-950 hover:bg-corporate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-corporate-100 transition-colors text-corporate-950"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-corporate-100">
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => {
                    onNavigate(page);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium text-left transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-corporate-950 text-white'
                      : 'text-corporate-950 hover:bg-corporate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-corporate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={awsmunLogo} alt="AWSMUN Logo" className="w-10 h-10 rounded-full object-cover" />
                <span className="font-serif text-xl font-semibold">AWSMUN</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Ambitus World School Model United Nations. Empowering youth through diplomacy and global engagement.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('committees')} className="hover:text-white transition-colors">
                    Committees
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('register')} className="hover:text-white transition-colors">
                    Register
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>mun.vja@ambitusworldschool.com</li>
                <li>Ambitus World School Campus</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-corporate-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>2026 Ambitus World School Model United Nations — Edition IV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
