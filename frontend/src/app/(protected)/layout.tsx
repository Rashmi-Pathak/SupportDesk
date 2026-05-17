'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Ticket, LayoutDashboard, Users, Package, Settings,
  LogOut, ChevronLeft, ChevronRight, Bell, UserCircle, Shield,
  Home, PlusCircle, Inbox, ClipboardList, ShoppingBag
} from 'lucide-react';
import styles from './protected.module.css';

// --- Role-based navigation ---
const ADMIN_NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/tickets',    label: 'All Tickets', icon: Ticket },
  { href: '/customers',  label: 'Customers',   icon: Users },
  { href: '/orders',     label: 'Orders',      icon: Package },
];
const ADMIN_EXTRA = [
  { href: '/team',     label: 'Team',     icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const AGENT_NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/my-tickets',  label: 'My Tickets',   icon: ClipboardList },
  { href: '/tickets',     label: 'All Tickets',  icon: Ticket },
  { href: '/customers',   label: 'Customers',    icon: Users },
];

const CONSULTING_AGENT_NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/orders?my=true', label: 'My Orders', icon: ClipboardList },
  { href: '/orders',     label: 'All Orders',  icon: Package },
  { href: '/customers',   label: 'Customers',   icon: Users },
];

const CUSTOMER_NAV = [
  { href: '/portal',      label: 'Home',         icon: Home },
  { href: '/my-orders',   label: 'My Orders',    icon: ShoppingBag },
  { href: '/my-tickets',  label: 'My Tickets',   icon: Inbox },
  { href: '/new-ticket',  label: 'New Ticket',   icon: PlusCircle },
];

// Page titles per route
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/tickets':    'All Tickets',
  '/my-tickets': 'My Tickets',
  '/my-orders':  'My Orders',
  '/customers':  'Customers',
  '/orders':     'Orders',
  '/team':       'Team Management',
  '/settings':   'Settings',
  '/portal':     'Customer Portal',
  '/new-ticket': 'Create Ticket',
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isAgent, isCustomer, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Command Palette State ---
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [cmdResults, setCmdResults] = useState<{ id: string; type: string; title: string; subtitle: string; link: string }[]>([]);
  const [cmdIndex, setCmdIndex] = useState(0);
  const [allSearchableData, setAllSearchableData] = useState<{ id: string; type: string; title: string; subtitle: string; link: string }[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        const unread = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000); // Check every 15s
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount, pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Redirect customers away from staff pages, and consulting agents away from ticket pages
  useEffect(() => {
    if (!isLoading && user) {
      const isConsultingAgent = user.role === 'Agent' && user.agentId && (
        user.agentId >= 'AGT-1025' && user.agentId <= 'AGT-1034'
      );
      
      const staffPages = ['/dashboard', '/tickets', '/customers', '/orders', '/team', '/settings'];
      const customerPages = ['/portal', '/my-tickets', '/new-ticket'];

      if (isCustomer && staffPages.includes(pathname)) {
        router.push('/portal');
        return;
      }
      
      if (isConsultingAgent && (pathname === '/my-tickets' || pathname === '/tickets')) {
        router.push('/orders');
        return;
      }

      if (!isCustomer && customerPages.includes(pathname) && pathname === '/portal') {
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, user, isCustomer, pathname, router]);

  // --- Load Searchable Data for Command Palette ---
  useEffect(() => {
    if (!user) return;
    
    const loadSearchableData = async () => {
      const items: typeof cmdResults = [];
      
      try {
        if (user.role !== 'Customer') {
          // Load Tickets
          const tRes = await api.getTickets({ limit: 100 });
          if (tRes.success && tRes.data) {
            tRes.data.forEach((t: any) => {
              items.push({
                id: t.ticketId,
                type: 'Ticket',
                title: t.subject,
                subtitle: `Ticket #${t.ticketId.slice(-8)} • Customer: ${t.customerName}`,
                link: `/tickets?view=${t.ticketId}`
              });
            });
          }
          
          // Load Orders
          const oRes = await api.getOrders({ limit: 100 });
          if (oRes.success && oRes.data) {
            oRes.data.forEach((o: any) => {
              items.push({
                id: o.orderId,
                type: 'Order',
                title: `${o.product} (${o.orderId})`,
                subtitle: `Order • Customer: ${o.customerName} • Status: ${o.status}`,
                link: `/orders?view=${o.orderId}`
              });
            });
          }
          
          // Load Customers
          const cRes = await api.getCustomers();
          if (cRes.success && cRes.data) {
            cRes.data.forEach((c: any) => {
              items.push({
                id: c.customerId,
                type: 'Customer',
                title: c.name,
                subtitle: `Customer • Email: ${c.email}`,
                link: `/customers`
              });
            });
          }
        } else {
          // Customer tickets and orders
          const tRes = await api.getMyAssignedTickets();
          if (tRes.success && tRes.data) {
            tRes.data.forEach((t: any) => {
              items.push({
                id: t.ticketId,
                type: 'Ticket',
                title: t.subject,
                subtitle: `My Ticket #${t.ticketId.slice(-8)}`,
                link: `/my-tickets?view=${t.ticketId}`
              });
            });
          }
          
          const oRes = await api.customerGetMyOrders();
          if (oRes.success && oRes.data) {
            oRes.data.forEach((o: any) => {
              items.push({
                id: o.orderId,
                type: 'Order',
                title: `${o.product} (${o.orderId})`,
                subtitle: `My Order • Status: ${o.status}`,
                link: `/my-orders?view=${o.orderId}`
              });
            });
          }
        }
      } catch (err) {
        console.error('Failed to index command palette data', err);
      }
      
      setAllSearchableData(items);
    };
    
    loadSearchableData();
  }, [user]);

  // --- Filter Search Results ---
  useEffect(() => {
    if (!cmdSearch.trim()) {
      const defaults = [
        { id: 'dash', type: 'Action', title: 'Go to Dashboard', subtitle: 'View system analytics', link: '/dashboard' },
        { id: 'orders', type: 'Action', title: 'Go to Orders', subtitle: 'Manage product orders', link: isCustomer ? '/my-orders' : '/orders' },
        { id: 'custs', type: 'Action', title: 'Go to Customers', subtitle: 'View client database', link: '/customers' },
        { id: 'tix', type: 'Action', title: 'Go to Tickets', subtitle: 'Customer Support Tickets', link: isCustomer ? '/my-tickets' : '/tickets' }
      ];
      setCmdResults(defaults);
      setCmdIndex(0);
      return;
    }
    
    const query = cmdSearch.toLowerCase();
    const filtered = allSearchableData.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    ).slice(0, 8);
    
    setCmdResults(filtered);
    setCmdIndex(0);
  }, [cmdSearch, allSearchableData, isCustomer]);

  // --- Command Palette Key Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCmdSearch('');
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCmdKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCmdIndex(prev => (prev + 1) % Math.max(cmdResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCmdIndex(prev => (prev - 1 + cmdResults.length) % Math.max(cmdResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = cmdResults[cmdIndex];
      if (selected) {
        router.push(selected.link);
        setShowCommandPalette(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Loading SupportDesk...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Detect Consulting Agent
  const isConsultingAgent = user.role === 'Agent' && user.agentId && (
    user.agentId >= 'AGT-1025' && user.agentId <= 'AGT-1034'
  );

  // Select nav items based on role
  const mainItems = isCustomer 
    ? CUSTOMER_NAV 
    : isConsultingAgent 
      ? CONSULTING_AGENT_NAV 
      : isAgent 
        ? AGENT_NAV 
        : ADMIN_NAV;

  const extraItems = isAdmin ? ADMIN_EXTRA : [];
  const roleLabel = isCustomer 
    ? 'Customer' 
    : isConsultingAgent 
      ? 'Consulting Agent' 
      : isAgent 
        ? 'Agent' 
        : 'Admin';

  return (
    <div className={styles.layout}>
      {/* Command Palette Overlay */}
      {showCommandPalette && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
            zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '15vh', animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            style={{
              width: 600, background: 'rgba(26, 26, 62, 0.95)', border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input Bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ marginRight: 12, color: 'var(--text-muted)', fontSize: 16 }}>⌘</span>
              <input 
                autoFocus
                placeholder="Search tickets, orders, customers... (Arrow keys + Enter)"
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                onKeyDown={handleCmdKeyDown}
                style={{
                  flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)',
                  fontSize: 15, outline: 'none'
                }}
              />
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>ESC to exit</span>
            </div>
            
            {/* Results List */}
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: 8 }}>
              {cmdResults.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No matches found for "{cmdSearch}"
                </div>
              ) : (
                cmdResults.map((item, i) => {
                  const isActive = i === cmdIndex;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => { router.push(item.link); setShowCommandPalette(false); }}
                      onMouseEnter={() => setCmdIndex(i)}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: 10,
                        cursor: 'pointer', background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))' : 'transparent',
                        border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                        transition: 'background 0.1s'
                      }}
                    >
                      <div style={{
                        width: 64, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, marginRight: 14,
                        background: item.type === 'Ticket' ? 'rgba(99, 102, 241, 0.15)' : 
                                    item.type === 'Order' ? 'rgba(245, 158, 11, 0.15)' : 
                                    item.type === 'Customer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: item.type === 'Ticket' ? '#818cf8' : 
                               item.type === 'Order' ? '#fbbf24' : 
                               item.type === 'Customer' ? '#34d399' : 'var(--text-muted)',
                        border: item.type === 'Ticket' ? '1px solid rgba(99, 102, 241, 0.3)' : 
                                item.type === 'Order' ? '1px solid rgba(245, 158, 11, 0.3)' : 
                                item.type === 'Customer' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {item.type.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.subtitle}</div>
                      </div>
                      {isActive && <span style={{ fontSize: 14, color: '#818cf8' }}>↵</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href={isCustomer ? '/portal' : '/dashboard'} className={styles.sidebarLogo}>
            <div className={styles.logoIcon}><Ticket size={18} /></div>
            {!collapsed && <span>SupportDesk</span>}
          </Link>

          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navGroup}>
            {!collapsed && <span className={styles.navLabel}>{isCustomer ? 'Menu' : 'Main'}</span>}
            {mainItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          {extraItems.length > 0 && (
            <div className={styles.navGroup}>
              {!collapsed && <span className={styles.navLabel}>Admin</span>}
              {extraItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{user.name[0]}</div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <strong>{user.name}</strong>
                <span>{roleLabel}</span>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainArea}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {PAGE_TITLES[pathname] || 'SupportDesk'}
            </h1>
            <div style={{
              marginLeft: 16, fontSize: 11, background: 'rgba(255,255,255,0.04)',
              padding: '4px 10px', borderRadius: 8, color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ fontSize: 12 }}>⌨️</span> Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace' }}>Ctrl + K</kbd> to search everything
            </div>
          </div>
          <div className={styles.headerRight}>
            <Link href="/notifications" className={styles.headerBtn} style={{ position: 'relative' }} title="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className={styles.headerUser}>
              <UserCircle size={28} />
              <span>{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
