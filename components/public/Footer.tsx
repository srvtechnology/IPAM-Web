import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-bold text-white">IPAM Alumni Association</h3>
            <p className="mt-2 text-sm text-slate-400">
              Institute of Public Administration and Management, University of Sierra Leone.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Explore</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li><Link href="/directory" className="hover:text-white">Directory</Link></li>
              <li><Link href="/jobs" className="hover:text-white">Jobs</Link></li>
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/businesses" className="hover:text-white">Businesses</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Association</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/giving" className="hover:text-white">Giving</Link></li>
              <li><Link href="/pass" className="hover:text-white">Virtual Pass</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Account</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-white">Register</Link></li>
              <li><Link href="/admin/login" className="hover:text-white">Admin portal</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} IPAM Alumni Association. All rights reserved. Powered by SRV Technology.....
        </p>
      </div>
    </footer>
  );
}
