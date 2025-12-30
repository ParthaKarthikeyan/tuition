import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/students', label: 'Students', icon: '👥' },
  { path: '/classes', label: 'Classes', icon: '📚' },
  { path: '/attendance', label: 'Attendance', icon: '✓' },
  { path: '/payroll', label: 'Payroll', icon: '💰' },
  { path: '/payments', label: 'Payments', icon: '💳' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col">
        <div className="p-6 border-b border-navy-700">
          <h1 className="font-display text-2xl font-semibold text-amber-400">
            Tuition Tracker
          </h1>
          <p className="text-navy-400 text-sm mt-1">Math Classes</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-navy-700">
          <p className="text-navy-500 text-xs text-center">
            © 2025 Tuition Tracker
          </p>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

