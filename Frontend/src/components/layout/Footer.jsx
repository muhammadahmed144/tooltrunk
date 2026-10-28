import Link from 'next/link';
import { Wrench, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#080d17] border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">ToolTrunk</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Tools for a stronger community. Rent or lend tools in your local neighborhood safely and conveniently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/?category=Power+Tools" className="hover:text-emerald-400 transition-colors">
                  Browse Tools
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  My Rentals
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="hover:text-emerald-400 transition-colors">
                  Profile & Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="mailto:support@tooltrunk.com" className="hover:text-emerald-400 transition-colors">
                  support@tooltrunk.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="tel:+923001234567" className="hover:text-emerald-400 transition-colors">
                  +92 300 1234567
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-2.5 mt-4">
              <span className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 cursor-pointer transition-colors text-[10px] font-bold">
                f
              </span>
              <span className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 cursor-pointer transition-colors text-[10px] font-bold">
                𝕏
              </span>
              <span className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 cursor-pointer transition-colors text-[10px] font-bold">
                in
              </span>
              <span className="w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 cursor-pointer transition-colors text-[10px] font-bold">
                📷
              </span>
            </div>
          </div>

          {/* Community trust banner */}
          <div className="bg-[#0f1728] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <p className="text-white font-semibold text-xs mb-1">Local Neighbor Trust Engine</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Every rental builds trust with non-overlapping calendar guarantees and peer reputation verification.
              </p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
              <span>●</span> Verified community sharing
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2025 ToolTrunk. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
