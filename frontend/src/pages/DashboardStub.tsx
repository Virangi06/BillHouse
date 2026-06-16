import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import API from '../utils/api';
import InvoiceList from '../components/invoices/InvoiceList';
import InvoiceForm from '../components/invoices/InvoiceForm';
import InvoiceDetail from '../components/invoices/InvoiceDetail';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import BusinessSettings from '../components/settings/BusinessSettings';
import BusinessProfilePage from '../components/profile/BusinessProfilePage';
import { useBusinessProfile } from '../context/BusinessContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Building2,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  BarChart3,
  UserPlus,
  Eye
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Client Data Model
interface ClientData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  createdAt: string;
}

// Invoices Data Model
interface InvoiceData {
  _id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue';
}

// Stats Response Interface
interface DashboardStats {
  totalRevenue: number;
  outstanding: number;
  paidInvoicesCount: number;
  overdueInvoicesCount: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  revenueTrendData: Array<{ day: string; value: number }>;
  recentInvoices: InvoiceData[];
  recentActivity: Array<{
    type: string;
    message: string;
    meta: string;
    time: string;
    color: string;
  }>;
  clientsCount: number;
  sparklineRevenue: Array<{ v: number }>;
  sparklineOutstanding: Array<{ v: number }>;
  sparklinePaid: Array<{ v: number }>;
  sparklineOverdue: Array<{ v: number }>;
  trends: {
    revenueChange: number;
    outstandingChange: number;
    paidChange: number;
    overdueChange: number;
  };
}

export const DashboardStub: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasCompletedOnboarding, isLoadingBusiness } = useBusinessProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const action = searchParams.get('action');

  // Date range utility
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startStr = startOfCurrentMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endOfCurrentMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  // State Management
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search filter
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: ''
  });
  const [isDeletingClient, setIsDeletingClient] = useState<ClientData | null>(null);

  // Profile Dropdown and row menus Refs
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Fetch Stats (Dashboard metrics)
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const response = await API.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to fetch dashboard metrics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await API.get<ClientData[]>('/clients');
      setClients(response.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to fetch clients from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchDashboardStats();
  }, [activeTab]);

  // Handle click outside hooks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile Dropdown click outside
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      // Row Menu click outside
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (tab: 'dashboard' | 'clients' | 'invoices' | 'settings' | 'profile') => {
    setSearchParams({ tab });
    setActiveMenuId(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Client modal handlers
  const openAddClientModal = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      taxId: '',
      address: ''
    });
    setErrorMsg(null);
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: ClientData) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      taxId: client.taxId || '',
      address: client.address || ''
    });
    setErrorMsg(null);
    setIsClientModalOpen(true);
    setActiveMenuId(null);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!clientForm.name || !clientForm.email) {
      setErrorMsg('Name and email are required fields');
      return;
    }

    try {
      if (editingClient) {
        // PUT update
        const response = await API.put(`/clients/${editingClient._id}`, clientForm);
        setSuccessMsg('Client details updated successfully!');
        setClients(prev => prev.map(c => c._id === editingClient._id ? response.data.client : c));
      } else {
        // POST create
        const response = await API.post('/clients', clientForm);
        setSuccessMsg('New client added successfully!');
        setClients(prev => [response.data.client, ...prev]);
      }
      setIsClientModalOpen(false);
      fetchDashboardStats(); // Refresh stats counters
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error saving client information');
    }
  };

  const handleDeleteClient = async () => {
    if (!isDeletingClient) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await API.delete(`/clients/${isDeletingClient._id}`);
      setSuccessMsg('Client deleted successfully');
      setClients(prev => prev.filter(c => c._id !== isDeletingClient._id));
      setIsDeletingClient(null);
      setActiveMenuId(null);
      fetchDashboardStats(); // Refresh stats counters
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error deleting client record');
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.taxId && c.taxId.toLowerCase().includes(clientSearchQuery.toLowerCase()))
  );

  // Formatting utility to INR (₹)
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Sparklines matching stats layout from backend
  const sparkRevenue = stats?.sparklineRevenue || [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }];
  const sparkOutstanding = stats?.sparklineOutstanding || [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }];
  const sparkPaid = stats?.sparklinePaid || [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }];
  const sparkOverdue = stats?.sparklineOverdue || [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-navy">
      
      {/* 1. LEFT SIDEBAR - Zero Trust design */}
      <aside className="w-64 bg-[#061B2D] text-white flex flex-col justify-between shrink-0 relative z-20 transition-all duration-300">
        
        {/* Top Branding Logo area */}
        <div className="p-6 flex flex-col gap-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/Logo.png" 
                alt="BillHouse Logo" 
                className="h-10 w-auto rounded-lg mix-blend-multiply bg-transparent shrink-0" 
              />
              <span className="text-xl font-bold tracking-tight text-white select-none">BillHouse</span>
            </Link>
          </div>
          <span className="text-[10px] font-bold text-green-mint uppercase tracking-widest pl-1 mt-1">
            Create. Send. Get Paid.
          </span>
        </div>

        {/* Navigation Lists - Aligned to core MVP modules in project plan */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          
          {/* Module 2: Dashboard */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-[#0C4737] text-white shadow-md border-l-4 border-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 text-green" />
            Dashboard
          </button>

          {/* Module 3: Invoices */}
          <button
            onClick={() => handleTabChange('invoices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'invoices'
                ? 'bg-[#0C4737] text-white shadow-md border-l-4 border-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="h-5 w-5 text-green" />
            Invoices
          </button>

          {/* Module 2: Client Management */}
          <button
            onClick={() => handleTabChange('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'clients'
                ? 'bg-[#0C4737] text-white shadow-md border-l-4 border-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="h-5 w-5 text-green" />
            Clients
            {clients.length > 0 && (
              <span className="text-xs bg-green text-white font-bold px-2 py-0.5 rounded-full ml-auto">
                {clients.length}
              </span>
            )}
          </button>

          {/* Module 6: Reports & Analytics */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 cursor-not-allowed opacity-50"
            title="Reports Module (Module 6)"
            disabled
          >
            <BarChart3 className="h-5 w-5" />
            Reports
            <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full ml-auto">Mod 6</span>
          </button>

          {/* Business Profile tab link */}
          <button
            onClick={() => handleTabChange('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-[#0C4737] text-white shadow-md border-l-4 border-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="h-5 w-5 text-green" />
            Business Profile
          </button>

          {/* Module 7: Settings */}
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-[#0C4737] text-white shadow-md border-l-4 border-green'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="h-5 w-5 text-green" />
            Settings
          </button>
        </nav>

        {/* Pro Upgrades Info */}
        <div className="p-4">
          <div className="p-4 bg-gradient-to-br from-[#0F1E2E] to-[#0A2923] border border-green/20 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green">
              <span className="text-yellow-500 text-sm">👑</span>
              <span className="text-xs font-bold uppercase tracking-wider text-green-mint">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Unlock advanced features like recurring invoices, custom branding & reminders.
            </p>
            <button className="w-full py-2 bg-green hover:bg-[#257362] text-white transition-all rounded-xl text-xs font-bold shadow-sm">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Footer info collapse */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer select-none">
            <span>◀</span>
            <span className="font-semibold">Collapse</span>
          </div>
          <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">M1 & M2 Active</span>
        </div>
      </aside>

      {/* 2. MAIN PANEL WINDOW */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Navigation panel */}
        <header className="bg-white border-b border-navy/5 py-4 px-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm shrink-0 sticky top-0 z-10">
          
          {/* Welcome Greeting context */}
          <div className="flex flex-col text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-navy tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Alex'}! 👋
            </h1>
            <p className="text-xs text-text-secondary font-semibold mt-0.5">
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Quick Actions Search, Profile, Notification */}
          <div className="flex items-center gap-5 w-full sm:w-auto justify-end">
            
            {/* Search Bar matching screenshot */}
            <div className="relative max-w-xs w-full hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-12 py-2 text-xs rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-navy/5 text-text-secondary px-1.5 py-0.5 rounded font-mono font-bold select-none border border-navy/5">
                ⌘K
              </span>
            </div>

            {/* Notification Badge */}
            <div className="relative p-2 hover:bg-navy/5 rounded-xl cursor-pointer transition-all text-navy shrink-0">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E76F51] text-[9px] text-white font-bold rounded-full flex items-center justify-center shadow-sm">
                3
              </span>
            </div>

            <hr className="h-6 border-r border-navy/10 hidden sm:block shrink-0" />

            {/* Interactive User Profile dropdown - Under Profile Pic */}
            <div className="relative" ref={profileDropdownRef}>
              <div 
                className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-navy/5 rounded-2xl transition-all"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                {/* Dynamic Initial Avatar */}
                <div className="h-9 w-9 bg-[#0C4737] text-white font-extrabold rounded-xl flex items-center justify-center uppercase shadow-sm shrink-0">
                  {user?.name ? user.name.slice(0, 2) : 'AJ'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-navy leading-tight">{user?.name || 'Alex Johnson'}</span>
                  <span className="text-[10px] text-text-secondary font-semibold leading-tight mt-0.5">
                    {user?.name ? `${user.name.split(' ')[0]}'s Org` : 'My Business'}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-text-secondary hidden sm:block shrink-0 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Profile dropdown container */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-14 z-30 w-48 bg-white border border-navy/5 shadow-xl rounded-2xl p-2 flex flex-col gap-1 animate-float-fast">
                  <div className="px-3 py-2.5 border-b border-navy/5 flex flex-col text-left">
                    <span className="text-xs font-extrabold text-navy truncate">{user?.name}</span>
                    <span className="text-[10px] text-text-secondary font-semibold truncate mt-0.5">{user?.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-xs font-bold text-red-500 hover:bg-red-500/5 p-2.5 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Notifications alerts banner */}
        {successMsg && (
          <div className="mx-8 mt-6 p-4 bg-green/10 border border-green/35 text-green-dark text-xs font-bold rounded-2xl animate-float-fast flex justify-between items-center">
            <span>{successMsg}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setSuccessMsg(null)} />
          </div>
        )}
        {errorMsg && (
          <div className="mx-8 mt-6 p-4 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-2xl animate-float-fast flex justify-between items-center">
            <span>{errorMsg}</span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setErrorMsg(null)} />
          </div>
        )}

        {/* 3. CORE VIEWS SWITCH */}
        <main className="p-8 flex-grow">
          
          {activeTab === 'dashboard' ? (
            /* ========================================================
               DYNAMIC DASHBOARD VIEW (INR)
               ======================================================== */
            <div className="flex flex-col gap-8 max-w-7xl mx-auto">
              
              {/* Filter bar - Calendar selection */}
              <div className="flex justify-between items-center bg-white border border-navy/5 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-green inline-block"></span>
                  <span>Active Workspace: Isolated Multi-Tenant Schema (INR)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border border-navy/10 rounded-xl text-xs font-bold text-navy hover:bg-navy/5 cursor-pointer bg-white">
                  <Calendar className="h-4 w-4 text-green" />
                  <span>{getCurrentMonthRange()}</span>
                  <ChevronDown className="h-3 w-3 text-text-secondary ml-1" />
                </div>
              </div>

              {/* Complete business profile nudge banner */}
              {!hasCompletedOnboarding && (
                <div className="bg-gradient-to-r from-green/10 to-green-mint/10 border border-green/20 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="p-2.5 bg-[#0C4737] text-white rounded-xl text-base shrink-0 shadow-inner">
                      🏢
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-navy">Complete your business profile</h3>
                      <p className="text-xs text-text-secondary mt-0.5 font-semibold leading-relaxed">
                        Add your brand logo, GSTIN, PAN, and bank details to generate professional, compliant invoices.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTabChange('settings')}
                    variant="primary"
                    className="text-xs font-bold py-2.5 px-4 rounded-xl shrink-0"
                  >
                    Setup Profile
                  </Button>
                </div>
              )}

              {/* Onboarding steps walkthrough card */}
              {stats && (stats.clientsCount === 0 || !stats.recentInvoices || stats.recentInvoices.length === 0) && (
                <div className="bg-gradient-to-r from-[#0C4737]/10 to-[#2F8F7A]/10 border border-[#2F8F7A]/25 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm my-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-[#0C4737] text-white rounded-2xl shrink-0 shadow-inner text-base">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy">Quick Start Onboarding Steps</h3>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed font-semibold">
                        {stats.clientsCount === 0 
                          ? "Step 1: Register your first client to start sending invoices."
                          : "Step 2: Great job! Now create your very first invoice."}
                      </p>
                    </div>
                  </div>
                  <div>
                    {stats.clientsCount === 0 ? (
                      <Button
                        onClick={() => handleTabChange('clients')}
                        variant="primary"
                        className="text-xs font-bold py-2.5 px-4 rounded-xl shadow-md"
                      >
                        Create Your First Client
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setSearchParams({ tab: 'invoices', action: 'create' })}
                        variant="primary"
                        className="text-xs font-bold py-2.5 px-4 rounded-xl shadow-md"
                      >
                        Create Your First Invoice
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {statsLoading ? (
                /* Stats Loading Spinner */
                <div className="flex flex-col gap-4 justify-center items-center py-20 bg-white border border-navy/5 rounded-2xl">
                  <div className="w-10 h-10 border-4 border-green/20 border-t-green rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-text-secondary animate-pulse">Calculating tenant dashboard metrics...</span>
                </div>
              ) : (
                <>
                  {/* A. Core Stats Row - Sparkline graphs - INR format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Stat 1: Total Revenue */}
                    <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex justify-between items-center">
                      <div className="flex flex-col gap-1.5 font-semibold">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-green/10 text-green rounded-lg shrink-0">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          Total Revenue
                        </div>
                        <span className="text-2xl font-extrabold text-navy mt-1">
                          {formatINR(stats?.totalRevenue || 0)}
                        </span>
                        {stats?.trends ? (
                          <span className={`text-[10px] ${stats.trends.revenueChange >= 0 ? 'text-green' : 'text-red-500'} font-bold flex items-center gap-1 mt-1`}>
                            {stats.trends.revenueChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {stats.trends.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.trends.revenueChange)}% <span className="text-text-secondary font-medium">from last month</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary font-semibold mt-1">Calculating trend...</span>
                        )}
                      </div>
                      {/* Micro sparkline */}
                      <div className="w-20 h-10 select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkRevenue} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2F8F7A" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2F8F7A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#2F8F7A" strokeWidth={2.5} fill="url(#colorRev)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stat 2: Outstanding */}
                    <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex justify-between items-center">
                      <div className="flex flex-col gap-1.5 font-semibold">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          Outstanding
                        </div>
                        <span className="text-2xl font-extrabold text-navy mt-1">
                          {formatINR(stats?.outstanding || 0)}
                        </span>
                        {stats?.trends ? (
                          <span className={`text-[10px] ${stats.trends.outstandingChange >= 0 ? 'text-green' : 'text-red-500'} font-bold flex items-center gap-1 mt-1`}>
                            {stats.trends.outstandingChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {stats.trends.outstandingChange >= 0 ? '↑' : '↓'} {Math.abs(stats.trends.outstandingChange)}% <span className="text-text-secondary font-medium">from last month</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary font-semibold mt-1">Calculating trend...</span>
                        )}
                      </div>
                      {/* Micro sparkline */}
                      <div className="w-20 h-10 select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkOutstanding} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                            <defs>
                              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2F8F7A" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2F8F7A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#2F8F7A" strokeWidth={2.5} fill="url(#colorOut)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stat 3: Paid Invoices */}
                    <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex justify-between items-center">
                      <div className="flex flex-col gap-1.5 font-semibold">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-green/10 text-green rounded-lg shrink-0">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          Paid Invoices
                        </div>
                        <span className="text-2xl font-extrabold text-navy mt-1">
                          {stats?.paidInvoicesCount || 0}
                        </span>
                        {stats?.trends ? (
                          <span className={`text-[10px] ${stats.trends.paidChange >= 0 ? 'text-green' : 'text-red-500'} font-bold flex items-center gap-1 mt-1`}>
                            {stats.trends.paidChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {stats.trends.paidChange >= 0 ? '↑' : '↓'} {Math.abs(stats.trends.paidChange)}% <span className="text-text-secondary font-medium">from last month</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary font-semibold mt-1">Calculating trend...</span>
                        )}
                      </div>
                      {/* Micro sparkline */}
                      <div className="w-20 h-10 select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkPaid} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                            <defs>
                              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2F8F7A" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2F8F7A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#2F8F7A" strokeWidth={2.5} fill="url(#colorPaid)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stat 4: Overdue Invoices */}
                    <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex justify-between items-center">
                      <div className="flex flex-col gap-1.5 font-semibold">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          Overdue Invoices
                        </div>
                        <span className="text-2xl font-extrabold text-navy mt-1">
                          {stats?.overdueInvoicesCount || 0}
                        </span>
                        {stats?.trends ? (
                          <span className={`text-[10px] ${stats.trends.overdueChange >= 0 ? 'text-red-500' : 'text-green'} font-bold flex items-center gap-1 mt-1`}>
                            {stats.trends.overdueChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {stats.trends.overdueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.trends.overdueChange)} <span className="text-text-secondary font-medium">from last month</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary font-semibold mt-1">Calculating trend...</span>
                        )}
                      </div>
                      {/* Micro sparkline red */}
                      <div className="w-20 h-10 select-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkOverdue} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                            <defs>
                              <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E76F51" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#E76F51" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#E76F51" strokeWidth={2.5} fill="url(#colorOverdue)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* B. Line Charts Row (Revenue & Donut chart) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 1. Revenue Overview Graph */}
                    <div className="lg:col-span-2 bg-white border border-navy/5 p-6 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-navy">Revenue Overview (INR)</h3>
                          <p className="text-[10px] text-text-secondary mt-0.5">Continuous billing monitoring</p>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1.5 border border-navy/10 rounded-xl text-xs font-bold text-navy bg-white hover:bg-navy/5 cursor-pointer">
                          <span>This Month</span>
                          <ChevronDown className="h-3.5 w-3.5 text-text-secondary ml-1" />
                        </div>
                      </div>
                      {stats?.revenueTrendData && stats.revenueTrendData.some(d => d.value > 0) ? (
                        <div className="h-64 w-full select-none">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorMainRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2F8F7A" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#2F8F7A" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="day" stroke="#5F6B76" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#5F6B76" fontSize={10} tickLine={false} axisLine={false} />
                              <RechartsTooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                              <Area type="monotone" dataKey="value" stroke="#2F8F7A" strokeWidth={3} fillOpacity={1} fill="url(#colorMainRev)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 w-full flex flex-col justify-center items-center bg-[#F8FAFC]/50 border border-dashed border-navy/10 rounded-2xl select-none">
                          <BarChart3 className="h-8 w-8 text-text-secondary/40" />
                          <span className="text-xs font-bold text-text-secondary mt-2">No revenue data available yet</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Donut Distribution Chart */}
                    <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-navy">Invoice Status</h3>
                        <p className="text-[10px] text-text-secondary mt-0.5">Current cycle summary</p>
                      </div>
                      {/* Pie Donut display */}
                      {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                        <>
                          <div className="h-44 w-full relative flex items-center justify-center select-none my-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={stats.statusDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {stats.statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            {/* Centered text total */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-extrabold text-navy leading-none">
                                {stats.recentInvoices.length}
                              </span>
                              <span className="text-[10px] text-text-secondary font-bold mt-1">Invoices</span>
                            </div>
                          </div>
                          {/* Legend list */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-semibold text-text-secondary border-t border-navy/5 pt-4">
                            {stats.statusDistribution.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                                <span>{item.name}: {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-44 w-full flex flex-col justify-center items-center select-none my-4">
                          <FileText className="h-8 w-8 text-text-secondary/40 animate-pulse" />
                          <span className="text-[11px] font-bold text-text-secondary mt-2">No invoices recorded yet</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* C. Bottom Section: Invoices & Bank Accounts/Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 1. Left Grid: Recent Invoices Table - INR values */}
                    <div className="lg:col-span-2 bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-sm font-bold text-navy">Recent Invoices</h3>
                            <p className="text-[10px] text-text-secondary mt-0.5">Most recent accounts actions</p>
                          </div>
                          <span className="text-xs font-bold text-green hover:underline cursor-not-allowed opacity-60 flex items-center gap-1">
                            View all invoices →
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-navy/5 text-text-secondary uppercase text-[10px] tracking-wider font-extrabold">
                                <th className="pb-3 pr-2">Invoice #</th>
                                <th className="pb-3 pr-2">Client</th>
                                <th className="pb-3 pr-2">Date</th>
                                <th className="pb-3 pr-2">Due Date</th>
                                <th className="pb-3 pr-2">Amount</th>
                                <th className="pb-3 pr-2">Status</th>
                                <th className="pb-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-navy/5 text-navy font-semibold">
                              {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-10 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                      <FileText className="h-8 w-8 text-text-secondary/40" />
                                      <span className="text-xs font-bold text-text-secondary">No invoices found</span>
                                      <Button
                                        onClick={() => setSearchParams({ tab: 'invoices', action: 'create' })}
                                        variant="primary"
                                        className="text-xs font-bold py-1.5 px-3 rounded-xl mt-1.5 shadow-sm"
                                      >
                                        Create First Invoice
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                stats.recentInvoices.map((inv) => (
                                  <tr key={inv._id} className="hover:bg-cream/40">
                                    <td className="py-3.5 pr-2 font-mono font-bold text-green-dark">{inv.number}</td>
                                    <td className="py-3.5 pr-2 font-extrabold">{inv.clientName}</td>
                                    <td className="py-3.5 pr-2 text-text-secondary">
                                      {new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-3.5 pr-2 text-text-secondary">
                                      {new Date(inv.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-3.5 pr-2 font-extrabold">{formatINR(inv.totalAmount)}</td>
                                    <td className="py-3.5 pr-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        inv.status === 'Paid'
                                          ? 'bg-green/10 text-green'
                                          : inv.status === 'Sent'
                                            ? 'bg-blue-500/10 text-blue-500'
                                            : inv.status === 'Viewed'
                                              ? 'bg-teal-500/10 text-teal-600'
                                              : 'bg-red-500/10 text-red-500'
                                      }`}>
                                        {inv.status}
                                      </span>
                                    </td>
                                    <td className="py-3.5 text-center">
                                      <button 
                                        onClick={() => setSearchParams({ tab: 'invoices', action: 'detail', id: inv._id })}
                                        className="p-1.5 hover:bg-navy/5 rounded text-text-secondary hover:text-navy"
                                        title="View Invoice"
                                      >
                                        <Eye className="h-4.5 w-4.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 2. Right Grid: Quick Actions & Timeline logs */}
                    <div className="flex flex-col gap-6">
                      
                      {/* Main CTA button */}
                      <Button 
                        variant="primary" 
                        onClick={() => setSearchParams({ tab: 'invoices', action: 'create' })}
                        className="w-full py-4 text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        New Invoice
                      </Button>

                      {/* Quick Actions List card - Aligned to core plan modules */}
                      <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Quick Actions</h4>
                        <div className="flex flex-col gap-1 text-xs font-semibold">
                          
                          {/* Live link to open New Client Modal */}
                          <div 
                            onClick={() => {
                              handleTabChange('clients');
                              setTimeout(() => openAddClientModal(), 150);
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-green/5 hover:text-green-dark rounded-xl cursor-pointer text-navy transition-all border border-transparent hover:border-green/20"
                          >
                            <UserPlus className="h-4 w-4 text-green" />
                            <span>Register New Client</span>
                          </div>
                          
                          <div 
                            onClick={() => setSearchParams({ tab: 'invoices', action: 'create' })}
                            className="flex items-center gap-3 p-3 hover:bg-green/5 hover:text-green-dark rounded-xl cursor-pointer text-navy transition-all border border-transparent hover:border-green/20"
                          >
                            <FileText className="h-4 w-4 text-green" />
                            <span>Create New Invoice</span>
                          </div>
                          
                        </div>
                      </div>

                      {/* Recent Activity timeline widget */}
                      <div className="bg-white border border-navy/5 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Recent Payments Activity</h4>
                        <div className="flex flex-col gap-3.5 text-xs text-text-secondary font-semibold">
                          
                          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                            <div className="py-4 text-center select-none flex flex-col items-center justify-center gap-1.5">
                              <Clock className="h-5 w-5 text-text-secondary/40" />
                              <span className="text-xs font-bold text-text-secondary">No recent activity</span>
                            </div>
                          ) : (
                            stats.recentActivity.map((act, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="p-1.5 bg-green/10 text-green rounded-full shrink-0 h-7 w-7 flex items-center justify-center mt-0.5">
                                  <CheckCircle className="h-4 w-4" style={{ color: act.color }} />
                                </div>
                                <div>
                                  <p className="font-bold text-navy">{act.message}</p>
                                  <p className="text-[10px] text-text-secondary mt-0.5">{act.meta}</p>
                                </div>
                              </div>
                            ))
                          )}

                        </div>
                      </div>

                    </div>

                  </div>
                </>
              )}

            </div>
          ) : activeTab === 'invoices' ? (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-fade-in">
              {action === 'create' || action === 'edit' ? (
                <InvoiceForm />
              ) : action === 'detail' ? (
                <InvoiceDetail />
              ) : (
                <InvoiceList />
              )}
            </div>
          ) : activeTab === 'clients' ? (
            /* ========================================================
               CLIENTS MANAGEMENT TAB VIEW (CRUD INTEGRATION)
               ======================================================== */
            <div className="flex flex-col gap-8 max-w-7xl mx-auto">
              
              {/* Clients Page Title Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-navy/5 p-6 rounded-2xl shadow-sm gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-navy tracking-tight">Clients Directory</h2>
                  <p className="text-xs text-text-secondary font-semibold mt-0.5">
                    Manage client profiles, addresses, tax IDs, and billing contacts.
                  </p>
                </div>
                <Button 
                  onClick={openAddClientModal}
                  variant="primary" 
                  className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-md hover:shadow-lg rounded-xl"
                >
                  <UserPlus className="h-4.5 w-4.5" />
                  Add Client
                </Button>
              </div>

              {/* Client List Grid Search / Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Search & Actions Panel */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Filter Search */}
                  <GlassCard className="p-6 bg-white border-navy/5 shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Search & Filters</h3>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    
                    {clientSearchQuery && (
                      <button
                        onClick={() => setClientSearchQuery('')}
                        className="text-left text-xs font-bold text-red-500 hover:underline flex items-center gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" /> Clear search filter
                      </button>
                    )}
                  </GlassCard>

                  {/* Summary Metric card */}
                  <GlassCard className="p-6 bg-gradient-to-br from-white to-green-mint/5 border-green/20 shadow-sm flex flex-col gap-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Clients Summary</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-navy">{filteredClients.length}</span>
                      <span className="text-xs font-bold text-text-secondary">Total matching</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      All metrics and tables are strictly isolated. No database query spills exist across tenants.
                    </p>
                  </GlassCard>

                </div>

                {/* Clients Table Card list */}
                <div className="lg:col-span-3">
                  <GlassCard className="p-6 bg-white border-navy/5 shadow-sm min-h-[400px] flex flex-col">
                    
                    {loading ? (
                      /* Loading Skeletons */
                      <div className="flex-1 flex flex-col gap-4 justify-center items-center py-10">
                        <div className="w-10 h-10 border-4 border-green/20 border-t-green rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-text-secondary animate-pulse">Retrieving isolated tenant lists...</span>
                      </div>
                    ) : filteredClients.length === 0 ? (
                      /* Empty State */
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6">
                        <div className="p-4 bg-green/10 rounded-full text-green mb-4 animate-float-medium">
                          <Users className="h-10 w-10" />
                        </div>
                        <h3 className="text-base font-bold text-navy">No clients found</h3>
                        <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed font-semibold">
                          {clientSearchQuery 
                            ? "No profiles match your search criteria. Try modifying the spelling or filters."
                            : "Your tenant workspace client register is currently empty. Get started by adding your first client."}
                        </p>
                        {!clientSearchQuery && (
                          <Button 
                            onClick={openAddClientModal}
                            variant="primary" 
                            className="mt-6 text-xs font-bold py-2.5 px-5 shadow rounded-xl flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" /> Add First Client
                          </Button>
                        )}
                      </div>
                    ) : (
                      /* Clients Directory Table */
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-navy/5 text-text-secondary uppercase text-[10px] tracking-wider font-extrabold">
                              <th className="pb-3 pr-2">Client Details</th>
                              <th className="pb-3 pr-2">Tax ID</th>
                              <th className="pb-3 pr-2">Phone</th>
                              <th className="pb-3 pr-2">Address</th>
                              <th className="pb-3 pr-2">Joined</th>
                              <th className="pb-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy/5 text-navy font-semibold">
                            {filteredClients.map((client) => (
                              <tr key={client._id} className="hover:bg-cream/40 transition-colors">
                                <td className="py-4 pr-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-extrabold text-sm">{client.name}</span>
                                    <span className="text-[10px] font-semibold text-text-secondary lowercase">{client.email}</span>
                                  </div>
                                </td>
                                <td className="py-4 pr-2">
                                  {client.taxId ? (
                                    <span className="font-mono text-[10px] bg-green/10 text-green-dark border border-green/20 px-2 py-0.5 rounded-full font-bold">
                                      {client.taxId}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-text-secondary font-medium italic">Not set</span>
                                  )}
                                </td>
                                <td className="py-4 pr-2 text-text-secondary font-mono">
                                  {client.phone || '-'}
                                </td>
                                <td className="py-4 pr-2 text-text-secondary max-w-[150px] truncate" title={client.address}>
                                  {client.address || '-'}
                                </td>
                                <td className="py-4 pr-2 text-text-secondary text-[11px]">
                                  {new Date(client.createdAt).toLocaleDateString(undefined, { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </td>
                                <td className="py-4 text-center relative">
                                  <button
                                    onClick={() => setActiveMenuId(activeMenuId === client._id ? null : client._id)}
                                    className="p-1.5 hover:bg-navy/5 rounded-xl text-text-secondary cursor-pointer transition-all inline-block"
                                  >
                                    <MoreHorizontal className="h-4.5 w-4.5" />
                                  </button>

                                  {/* Floating Actions overlay */}
                                  {activeMenuId === client._id && (
                                    <div 
                                      ref={actionMenuRef}
                                      className="absolute right-0 top-12 z-30 w-32 bg-white border border-navy/5 shadow-lg rounded-2xl p-2 flex flex-col gap-1.5 animate-float-fast text-left"
                                    >
                                      <button
                                        onClick={() => openEditClientModal(client)}
                                        className="w-full text-xs font-bold text-navy hover:text-green hover:bg-green/5 p-2 rounded-xl flex items-center gap-2 text-left transition-colors"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                      </button>
                                      <hr className="border-navy/5" />
                                      <button
                                        onClick={() => setIsDeletingClient(client)}
                                        className="w-full text-xs font-bold text-red-500 hover:bg-red-500/5 p-2 rounded-xl flex items-center gap-2 text-left transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </GlassCard>
                </div>

              </div>

            </div>
          ) : activeTab === 'profile' ? (
            <BusinessProfilePage />
          ) : activeTab === 'settings' ? (
            <BusinessSettings />
          ) : null}

        </main>
      </div>

      {/* ========================================================
         D. DIALOG MODALS SECTION (CRUD OPERATIONS POPUPS)
         ======================================================== */}
      
      {/* 1. Add / Edit Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-float-fast max-h-[90vh] overflow-y-auto">
            
            {/* Title Header bar */}
            <div className="flex justify-between items-center pb-4 border-b border-navy/5">
              <div>
                <h3 className="text-lg font-extrabold text-navy">
                  {editingClient ? 'Modify Client Details' : 'Register New Client'}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Tenant partitioned client contact profiles.
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 bg-navy/5 hover:bg-navy/10 rounded-full text-text-secondary cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Input Form */}
            <form onSubmit={handleClientSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              
              {/* Name field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary">Client Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation or Jane Doe"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary">Billing Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="billing@company.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Contact Number</label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                  />
                </div>

                {/* Tax ID field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Tax ID / GSTIN / VAT</label>
                  <input
                    type="text"
                    placeholder="27AAAAA1111A1Z1"
                    value={clientForm.taxId}
                    onChange={(e) => setClientForm({ ...clientForm, taxId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Billing Address field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary">Physical Billing Address</label>
                <textarea
                  placeholder="Street, City, State, ZIP, Country"
                  rows={3}
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-navy/5 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsClientModalOpen(false)}
                  className="py-3 px-5 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="py-3 px-6 text-xs font-bold shadow-md hover:shadow-lg"
                >
                  {editingClient ? 'Save Changes' : 'Register Client'}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {isDeletingClient && (
        <div className="fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 flex flex-col gap-5 text-center">
            
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full mx-auto w-16 h-16 flex items-center justify-center">
              <Trash2 className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-navy">Confirm Client Deletion</h3>
              <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                Are you sure you want to permanently delete client <strong>{isDeletingClient.name}</strong>? 
                This action is irreversible and will erase their billing information and records.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setIsDeletingClient(null)}
                className="py-2.5 px-4 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
              >
                No, Keep Record
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteClient}
                className="py-2.5 px-5 text-xs font-bold bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-sm"
              >
                Yes, Delete Client
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Onboarding Wizard Overlay */}
      {!hasCompletedOnboarding && !isLoadingBusiness && <OnboardingWizard />}

    </div>
  );
};

export default DashboardStub;
