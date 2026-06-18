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
import ClientDetail from '../components/clients/ClientDetail';
import logo from '../assets/Logo_transparent.png';
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
  Archive,
  RotateCcw,
  X,
  BarChart3,
  UserPlus,
  Eye,
  Menu
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
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  taxId?: string;
  gstNumber?: string;
  notes?: string;
  // Financial aggregates (populated from with-financials endpoint)
  totalBilled?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  invoiceCount?: number;
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [activeStatusInvoiceId, setActiveStatusInvoiceId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    taxId: '',
    gstNumber: '',
    address: '',
    country: 'India',
    notes: ''
  });
  const [isDeletingClient, setIsDeletingClient] = useState<ClientData | null>(null);
  // Selected client for detail view
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  // Client list sort/filter
  const [clientSortBy, setClientSortBy] = useState<'name' | 'date' | 'outstanding'>('name');
  const [clientCountryFilter, setClientCountryFilter] = useState<string>('All');
  const [clientStatusFilter, setClientStatusFilter] = useState<'active' | 'archived'>('active');
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);

  // Profile Dropdown and row menus Refs
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  // Global unified search state & refs
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic notification state & refs
  interface NotificationItem {
    id: string;
    type: 'payment' | 'invoice' | 'client' | 'system';
    title: string;
    message: string;
    time: string;
    read: boolean;
  }

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: 'payment',
      title: 'Payment Received',
      message: 'Received ₹45,000.00 from TechCorp Solutions for INV-000001.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 'n-2',
      type: 'invoice',
      title: 'Invoice Overdue Warning',
      message: 'Invoice INV-000002 for Acme Corp is 3 days overdue.',
      time: 'Yesterday',
      read: false
    },
    {
      id: 'n-3',
      type: 'client',
      title: 'New Client Registered',
      message: 'CloudScale Inc. was registered successfully.',
      time: '2 days ago',
      read: false
    },
    {
      id: 'n-4',
      type: 'system',
      title: 'Profile Completion 70%',
      message: 'Complete your tax & branding settings to unlock professional templates.',
      time: '3 days ago',
      read: true
    }
  ]);

  // Unified global keyboard shortcut for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Fetch Clients with financial aggregation (single query)
  const fetchClients = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (clientSortBy !== 'name') params.sortBy = clientSortBy;
      if (clientCountryFilter !== 'All') params.country = clientCountryFilter;
      if (clientStatusFilter === 'archived') params.archived = 'true';
      const response = await API.get<ClientData[]>('/clients/with-financials', { params });
      setClients(response.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to fetch clients from database');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountriesList = async () => {
    try {
      const params: any = {};
      if (clientStatusFilter === 'archived') params.archived = 'true';
      const response = await API.get<ClientData[]>('/clients/with-financials', { params });
      const countries = Array.from(new Set(response.data.map(c => c.country || 'India'))).filter(Boolean);
      setUniqueCountries(countries);
    } catch (err) {
      console.error('Failed to load countries list', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchDashboardStats();
    fetchCountriesList();
  }, [activeTab, clientSortBy, clientCountryFilter, clientStatusFilter]);

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
      // Global Search dropdown click outside
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      // Notifications dropdown click outside
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
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
    setIsMobileSidebarOpen(false);
  };

  // Client modal handlers
  const openAddClientModal = () => {
    setEditingClient(null);
    setClientForm({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      taxId: '',
      gstNumber: '',
      address: '',
      country: 'India',
      notes: ''
    });
    setErrorMsg(null);
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: ClientData) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      companyName: client.companyName || '',
      email: client.email,
      phone: client.phone || '',
      taxId: client.taxId || '',
      gstNumber: client.gstNumber || '',
      address: client.address || '',
      country: client.country || 'India',
      notes: client.notes || ''
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
        addNotification('client', 'Client Profile Updated', `${clientForm.name} details were updated successfully.`);
      } else {
        // POST create
        const response = await API.post('/clients', clientForm);
        setSuccessMsg('New client added successfully!');
        setClients(prev => [response.data.client, ...prev]);
        addNotification('client', 'New Client Registered', `${clientForm.name} was registered in the database.`);
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
      setSuccessMsg('Client archived successfully');
      setClients(prev => prev.filter(c => c._id !== isDeletingClient._id));
      addNotification('client', 'Client Archived', `${isDeletingClient.name} was archived to preserve invoice history.`);
      setIsDeletingClient(null);
      setActiveMenuId(null);
      fetchDashboardStats(); // Refresh stats counters
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error deleting client record');
    }
  };

  const handleReactivateClient = async (client: ClientData) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await API.put(`/clients/${client._id}`, { isArchived: false });
      setSuccessMsg('Client reactivated successfully');
      setClients(prev => prev.filter(c => c._id !== client._id));
      addNotification('client', 'Client Reactivated', `${client.name} is now active.`);
      fetchDashboardStats(); // Refresh stats counters
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error reactivating client');
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await API.patch(`/invoices/${invoiceId}/status`, { status: newStatus });
      setSuccessMsg(`Invoice status updated to ${newStatus}`);
      addNotification('invoice', 'Invoice Status Updated', `Invoice status changed to ${newStatus}.`);
      
      // Update local state and refetch stats to keep charts in sync
      if (stats) {
        const updatedInvoices = stats.recentInvoices.map(inv => {
          if (inv._id === invoiceId) {
            const total = inv.totalAmount;
            const amountPaid = newStatus === 'Paid' ? total : 0;
            const amountDue = total - amountPaid;
            return {
              ...inv,
              status: newStatus as any,
              amountPaid,
              amountDue
            };
          }
          return inv;
        });
        setStats(prev => prev ? { ...prev, recentInvoices: updatedInvoices } : null);
      }
      fetchDashboardStats();
      setActiveStatusInvoiceId(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error updating invoice status');
    }
  };

  // Global search filters
  const getSearchResults = () => {
    if (!globalSearchQuery.trim()) return { clients: [], invoices: [], actions: [] };
    const query = globalSearchQuery.toLowerCase().trim();

    const matchedClients = clients.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query)
    ).slice(0, 3);

    const matchedInvoices = (stats?.recentInvoices || []).filter(inv => 
      inv.number.toLowerCase().includes(query) || 
      inv.clientName.toLowerCase().includes(query)
    ).slice(0, 3);

    const allActions = [
      { label: 'Create New Invoice', tab: 'invoices', action: 'create', keywords: ['invoice', 'new', 'create', 'billing'] },
      { label: 'Add New Client', tab: 'clients', modal: 'client', keywords: ['client', 'new', 'add', 'register'] },
      { label: 'View Business Profile', tab: 'profile', keywords: ['profile', 'business', 'logo', 'branding', 'tax'] },
      { label: 'Open Settings', tab: 'settings', keywords: ['settings', 'config', 'setup'] }
    ];

    const matchedActions = allActions.filter(act => 
      act.label.toLowerCase().includes(query) || 
      act.keywords.some(kw => kw.includes(query))
    );

    return { clients: matchedClients, invoices: matchedInvoices, actions: matchedActions };
  };

  const searchResults = getSearchResults();
  const hasSearchResults = searchResults.clients.length > 0 || searchResults.invoices.length > 0 || searchResults.actions.length > 0;

  // Helper to add notifications dynamically
  const addNotification = (type: 'payment' | 'invoice' | 'client' | 'system', title: string, message: string) => {
    const newNotif: NotificationItem = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Notification action handlers
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsNotificationsOpen(false);

    // Context navigation based on type
    if (notif.type === 'payment' || notif.type === 'invoice') {
      handleTabChange('invoices');
    } else if (notif.type === 'client') {
      handleTabChange('clients');
    } else if (notif.type === 'system') {
      handleTabChange('profile');
    }
  };

  // Filter clients based on search query (searches name, email, companyName, gstNumber)
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (c.taxId && c.taxId.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (c.gstNumber && c.gstNumber.toLowerCase().includes(clientSearchQuery.toLowerCase()))
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

  if (isLoadingBusiness) {
    return (
      <div className="min-h-screen flex flex-col gap-4 justify-center items-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-green/20 border-t-green rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-text-secondary animate-pulse">Loading business profile...</span>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-gradient-mesh bg-[#F8FAFC]/90 flex font-sans text-navy">
      
      {/* Sidebar Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#061B2D]/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT SIDEBAR - Zero Trust design */}
      <aside className={`print:hidden fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-md border-r border-navy/5 text-navy flex flex-col justify-between shrink-0 z-40 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Top Branding Logo area */}
        <div className="py-4 px-6 border-b border-navy/5 flex items-center justify-between lg:justify-center shrink-0">
          <Link to="/" className="flex items-center justify-center">
            <img 
              src={logo} 
              alt="BillHouse Logo" 
              className="h-8 sm:h-9 lg:h-11 w-auto object-contain shrink-0" 
            />
          </Link>
          <button 
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 hover:bg-navy/5 rounded-xl text-navy/70 hover:text-navy lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Lists - Aligned to core MVP modules in project plan */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          
          {/* Module 2: Dashboard */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-green/10 text-green-dark border-l-4 border-green font-bold shadow-sm'
                : 'text-navy/70 hover:text-navy hover:bg-navy/5'
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
                ? 'bg-green/10 text-green-dark border-l-4 border-green font-bold shadow-sm'
                : 'text-navy/70 hover:text-navy hover:bg-navy/5'
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
                ? 'bg-green/10 text-green-dark border-l-4 border-green font-bold shadow-sm'
                : 'text-navy/70 hover:text-navy hover:bg-navy/5'
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
            onClick={() => setIsReportsModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-navy/70 hover:text-navy hover:bg-navy/5 transition-all duration-200"
            title="Reports & Analytics"
          >
            <BarChart3 className="h-5 w-5 text-green" />
            Reports
            <span className="text-[9px] bg-green/10 text-green px-1.5 py-0.5 rounded-full ml-auto font-bold">Pro</span>
          </button>

          {/* Business Settings */}
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'settings' || activeTab === 'profile'
                ? 'bg-green/10 text-green-dark border-l-4 border-green font-bold shadow-sm'
                : 'text-navy/70 hover:text-navy hover:bg-navy/5'
            }`}
          >
            <Settings className="h-5 w-5 text-green" />
            Business Settings
          </button>
        </nav>

        {/* Pro Upgrades Info */}
        <div className="p-4">
          <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-green/5 border border-green/15 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-dark">
              <span className="text-yellow-500 text-sm">👑</span>
              <span className="text-xs font-bold uppercase tracking-wider text-navy">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Unlock advanced features like recurring invoices, custom branding & reminders.
            </p>
            <button className="w-full py-2 bg-navy hover:bg-green-dark text-white transition-all rounded-xl text-xs font-bold shadow-sm active:scale-98">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Footer info collapse */}
        <div className="p-4 border-t border-navy/5 flex items-center justify-between text-xs text-navy/70">
          <div className="flex items-center gap-2 hover:text-navy cursor-pointer select-none">
            <span>◀</span>
            <span className="font-semibold">Collapse</span>
          </div>
          <span className="text-[9px] bg-navy/5 px-1.5 py-0.5 rounded text-navy/50 font-bold">M1 & M2 Active</span>
        </div>
      </aside>

      {/* 2. MAIN PANEL WINDOW */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto print:overflow-visible">
        
        {/* Top Header Navigation panel */}
        <header className="print:hidden bg-white border-b border-navy/5 py-3 px-4 md:px-8 flex flex-row items-center justify-between shadow-sm shrink-0 sticky top-0 z-10">
          
          {/* Welcome Greeting context with responsive hamburger toggler */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 -ml-1 hover:bg-navy/5 rounded-xl text-navy lg:hidden focus:outline-none shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="h-5.5 w-5.5 text-navy" />
            </button>
            <div className="flex flex-col text-left min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-navy tracking-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">
                Hello, {user?.name?.split(' ')[0] || 'Alex'}! 👋
              </h1>
              <p className="text-[10px] sm:text-xs text-text-secondary font-semibold mt-0.5 hidden xs:block">
                Here's what's happening today.
              </p>
            </div>
          </div>

          {/* Quick Actions Search, Profile, Notification */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 justify-end">
            
            {/* Search Bar matching screenshot */}
            <div className="relative max-w-xs w-full hidden md:block" ref={searchRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-12 py-2 text-xs rounded-xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
              />
              {globalSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-navy/5 text-text-secondary px-1.5 py-0.5 rounded font-mono font-bold select-none border border-navy/5">
                  ⌘K
                </span>
              )}

              {/* Dynamic Global Search Dropdown */}
              {isSearchFocused && globalSearchQuery && (
                <div className="absolute right-0 top-11 z-50 w-[320px] bg-white border border-navy/5 shadow-2xl rounded-2xl p-4 flex flex-col gap-4 animate-float-fast max-h-80 overflow-y-auto">
                  {!hasSearchResults ? (
                    <div className="text-center py-6 text-text-secondary/60">
                      <Search className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs font-bold">No results found for "{globalSearchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      {/* Matching Actions */}
                      {searchResults.actions.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Quick Actions</p>
                          {searchResults.actions.map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setGlobalSearchQuery('');
                                setIsSearchFocused(false);
                                if (act.modal === 'client') {
                                  handleTabChange('clients');
                                  setTimeout(() => openAddClientModal(), 150);
                                } else {
                                  if (act.action) {
                                    setSearchParams({ tab: act.tab, action: act.action });
                                  } else {
                                    handleTabChange(act.tab as any);
                                  }
                                }
                              }}
                              className="text-left text-xs font-bold text-navy hover:text-green hover:bg-green/5 p-2 rounded-xl transition-all"
                            >
                              ⚡ {act.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Clients */}
                      {searchResults.clients.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Clients</p>
                          {searchResults.clients.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                setGlobalSearchQuery('');
                                setIsSearchFocused(false);
                                handleTabChange('clients');
                                setClientSearchQuery(c.name);
                              }}
                              className="text-left text-xs font-bold text-navy hover:bg-green/5 p-2 rounded-xl transition-all flex flex-col gap-0.5"
                            >
                              <span className="font-extrabold">{c.name}</span>
                              <span className="text-[9px] font-semibold text-text-secondary lowercase">{c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Invoices */}
                      {searchResults.invoices.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Invoices</p>
                          {searchResults.invoices.map((inv) => (
                            <button
                              key={inv._id}
                              type="button"
                              onClick={() => {
                                setGlobalSearchQuery('');
                                setIsSearchFocused(false);
                                setSearchParams({ tab: 'invoices', action: 'detail', id: inv._id });
                              }}
                              className="text-left text-xs font-bold text-navy hover:bg-green/5 p-2 rounded-xl transition-all flex justify-between items-center"
                            >
                              <div>
                                <span className="font-mono text-green-dark font-black">{inv.number}</span>
                                <span className="text-[10px] text-text-secondary font-semibold ml-2">to {inv.clientName}</span>
                              </div>
                              <span className="text-[10px] font-extrabold">{formatINR(inv.totalAmount)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Notification Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 hover:bg-navy/5 rounded-xl cursor-pointer transition-all text-navy shrink-0 focus:outline-none"
                aria-label="Toggle notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E76F51] text-[9px] text-white font-bold rounded-full flex items-center justify-center shadow-sm">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[340px] bg-white border border-navy/5 shadow-2xl rounded-2xl p-4 flex flex-col gap-3.5 animate-float-fast">
                  <div className="flex justify-between items-center pb-2 border-b border-navy/5">
                    <span className="text-xs font-black text-navy uppercase tracking-wider">Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] font-bold text-green hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-text-secondary/60">
                        <Bell className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                        <span className="text-xs font-bold">No notifications</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-navy/5 relative ${
                            !notif.read ? 'bg-green/5' : 'bg-transparent'
                          }`}
                        >
                          {!notif.read && (
                            <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-green rounded-full"></span>
                          )}
                          <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${
                            notif.type === 'payment'
                              ? 'bg-green/10 text-green'
                              : notif.type === 'invoice'
                                ? 'bg-red-500/10 text-red-500'
                                : notif.type === 'client'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            <span className="text-xs">
                              {notif.type === 'payment' ? '💰' : notif.type === 'invoice' ? '⚠️' : notif.type === 'client' ? '👤' : '⚙️'}
                            </span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-black text-navy">{notif.title}</p>
                            <p className="text-[10px] text-text-secondary leading-normal mt-0.5 font-semibold">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-text-secondary/40 block mt-1 font-bold">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t border-navy/5 pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={handleClearAllNotifications}
                        className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="h-6 border-r border-navy/10 hidden sm:block shrink-0" />

            {/* Interactive User Profile dropdown - Under Profile Pic */}
            <div className="relative" ref={profileDropdownRef}>
              <div 
                className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-navy/5 rounded-2xl transition-all"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                {/* Dynamic Initial Avatar */}
                <div className="h-9 w-9 bg-navy text-white font-extrabold rounded-xl flex items-center justify-center uppercase shadow-sm shrink-0">
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
        <main className="p-4 sm:p-6 md:p-8 flex-grow">
          
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
                    <div className="p-2.5 bg-green text-white rounded-xl text-base shrink-0 shadow-inner">
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
                <div className="bg-gradient-to-r from-green/10 to-green-mint/10 border border-green/20 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm my-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-green text-white rounded-2xl shrink-0 shadow-inner text-base">
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
                <div className="flex flex-col gap-8">
                  {/* Stats Cards Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="glass-card p-6 rounded-3xl flex justify-between items-center animate-pulse">
                        <div className="flex flex-col gap-3 w-2/3">
                          <div className="h-4 bg-navy/10 rounded w-1/2"></div>
                          <div className="h-7 bg-navy/15 rounded w-3/4 mt-1"></div>
                          <div className="h-3 bg-navy/5 rounded w-full"></div>
                        </div>
                        <div className="w-16 h-10 bg-green/10 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                  {/* Charts Row Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-card p-6 rounded-3xl animate-pulse flex flex-col gap-4">
                      <div className="flex justify-between">
                        <div className="h-5 bg-navy/10 rounded w-1/4"></div>
                        <div className="h-8 bg-navy/10 rounded w-20"></div>
                      </div>
                      <div className="h-60 bg-navy/5 rounded-2xl w-full"></div>
                    </div>
                    <div className="glass-card p-6 rounded-3xl animate-pulse flex flex-col justify-between gap-4">
                      <div className="h-5 bg-navy/10 rounded w-1/3"></div>
                      <div className="h-40 bg-navy/5 rounded-full w-40 mx-auto"></div>
                      <div className="h-10 bg-navy/5 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* A. Core Stats Row - Sparkline graphs - INR format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Stat 1: Total Revenue */}
                    <div className="glass-card p-4 sm:p-6 rounded-3xl flex justify-between items-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col gap-1.5 font-semibold min-w-0">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-green/10 text-green rounded-lg shrink-0">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          Total Revenue
                        </div>
                        <span className="text-xl sm:text-2xl font-extrabold text-navy mt-1 truncate">
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
                      <div className="w-16 sm:w-20 h-10 select-none shrink-0">
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
                    <div className="glass-card p-4 sm:p-6 rounded-3xl flex justify-between items-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col gap-1.5 font-semibold min-w-0">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          Outstanding
                        </div>
                        <span className="text-xl sm:text-2xl font-extrabold text-navy mt-1 truncate">
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
                      <div className="w-16 sm:w-20 h-10 select-none shrink-0">
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
                    <div className="glass-card p-4 sm:p-6 rounded-3xl flex justify-between items-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col gap-1.5 font-semibold min-w-0">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-green/10 text-green rounded-lg shrink-0">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          Paid Invoices
                        </div>
                        <span className="text-xl sm:text-2xl font-extrabold text-navy mt-1 truncate">
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
                      <div className="w-16 sm:w-20 h-10 select-none shrink-0">
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
                    <div className="glass-card p-4 sm:p-6 rounded-3xl flex justify-between items-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col gap-1.5 font-semibold min-w-0">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
                          <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          Overdue Invoices
                        </div>
                        <span className="text-xl sm:text-2xl font-extrabold text-navy mt-1 truncate">
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
                      <div className="w-16 sm:w-20 h-10 select-none shrink-0">
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
                    <div className="lg:col-span-2 glass-card p-6 rounded-3xl hover:shadow-md transition-all duration-300">
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
                    <div className="glass-card p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
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
                    <div className="lg:col-span-2 glass-card p-6 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
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

                        {/* Desktop View Table */}
                        <div className="hidden sm:block overflow-x-auto">
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
                                    <td className="py-3.5 pr-2 relative">
                                      <div className="relative inline-block text-left">
                                        <button
                                          type="button"
                                          onClick={() => setActiveStatusInvoiceId(activeStatusInvoiceId === inv._id ? null : inv._id)}
                                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                            inv.status === 'Paid'
                                              ? 'bg-green/10 text-green'
                                              : inv.status === 'Sent'
                                                ? 'bg-blue-500/10 text-blue-500'
                                                : inv.status === 'Viewed'
                                                  ? 'bg-teal-500/10 text-teal-600'
                                                  : inv.status === 'Overdue'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-navy/10 text-navy/70'
                                          }`}
                                          title="Update status"
                                        >
                                          {inv.status}
                                          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                                        </button>

                                        {activeStatusInvoiceId === inv._id && (
                                          <div className="absolute left-0 mt-1.5 z-30 w-32 bg-white border border-navy/5 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 text-left animate-float-fast">
                                            {['Draft', 'Sent', 'Paid', 'Overdue'].map((st) => (
                                              <button
                                                key={st}
                                                type="button"
                                                onClick={() => handleUpdateInvoiceStatus(inv._id, st)}
                                                className={`w-full text-[10px] font-extrabold p-2 rounded-xl text-left transition-colors ${
                                                  inv.status === st 
                                                    ? 'bg-green/10 text-green' 
                                                    : 'text-navy hover:bg-navy/5'
                                                }`}
                                              >
                                                {st}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
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

                        {/* Mobile Cards View (under 640px) */}
                        <div className="block sm:hidden flex flex-col gap-4 mt-2">
                          {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
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
                          ) : (
                            stats.recentInvoices.map((inv) => (
                              <div key={inv._id} className="p-4 bg-white/50 border border-navy/5 rounded-2xl flex flex-col gap-3 relative hover:border-green/20 transition-all">
                                
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-bold text-green-dark text-xs">{inv.number}</span>
                                  
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setActiveStatusInvoiceId(activeStatusInvoiceId === inv._id ? null : inv._id)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer ${
                                        inv.status === 'Paid'
                                          ? 'bg-green/10 text-green'
                                          : inv.status === 'Sent'
                                            ? 'bg-blue-500/10 text-blue-500'
                                            : inv.status === 'Viewed'
                                              ? 'bg-teal-500/10 text-teal-600'
                                              : inv.status === 'Overdue'
                                                ? 'bg-red-500/10 text-red-500'
                                                : 'bg-navy/10 text-navy/70'
                                      }`}
                                    >
                                      {inv.status}
                                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                                    </button>

                                    {activeStatusInvoiceId === inv._id && (
                                      <div className="absolute right-0 mt-1.5 z-30 w-32 bg-white border border-navy/5 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 text-left animate-float-fast">
                                        {['Draft', 'Sent', 'Paid', 'Overdue'].map((st) => (
                                          <button
                                            key={st}
                                            type="button"
                                            onClick={() => handleUpdateInvoiceStatus(inv._id, st)}
                                            className={`w-full text-[10px] font-extrabold p-2 rounded-xl text-left transition-colors ${
                                              inv.status === st 
                                                ? 'bg-green/10 text-green' 
                                                : 'text-navy hover:bg-navy/5'
                                            }`}
                                          >
                                            {st}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1 text-[11px] text-text-secondary font-semibold">
                                  <div className="flex justify-between">
                                    <span>Client:</span>
                                    <span className="text-navy font-extrabold">{inv.clientName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>{new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Due Date:</span>
                                    <span>{new Date(inv.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                </div>

                                <hr className="border-navy/5 my-0.5" />

                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-sm text-navy">{formatINR(inv.totalAmount)}</span>
                                  <button 
                                    onClick={() => setSearchParams({ tab: 'invoices', action: 'detail', id: inv._id })}
                                    className="p-1.5 hover:bg-navy/5 rounded-xl text-text-secondary hover:text-navy flex items-center gap-1.5 text-[10px] font-bold"
                                  >
                                    <Eye className="h-4 w-4" /> View Details
                                  </button>
                                </div>

                              </div>
                            ))
                          )}
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
                      <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 hover:shadow-md transition-all duration-300">
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
                      <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 hover:shadow-md transition-all duration-300">
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
            <div className="flex flex-col gap-8 w-full max-w-full px-1 animate-fade-in">
              {action === 'create' || action === 'edit' ? (
                <InvoiceForm onAddNotification={addNotification} />
              ) : action === 'detail' ? (
                <InvoiceDetail onAddNotification={addNotification} />
              ) : (
                <InvoiceList onAddNotification={addNotification} />
              )}
            </div>
          ) : activeTab === 'clients' ? (
            /* ========================================================
               CLIENTS MANAGEMENT TAB VIEW (CRUD INTEGRATION)
               ======================================================== */
            <div className="flex flex-col gap-8 w-full max-w-full px-1">

              {/* ── If a client is selected, show ClientDetail. Otherwise show list. ── */}
              {selectedClientId ? (
                <ClientDetail
                  clientId={selectedClientId}
                  onBack={() => setSelectedClientId(null)}
                  onEdit={(client) => { openEditClientModal(client as any); setSelectedClientId(null); }}
                  onNavigateToInvoice={(invoiceId) => {
                    setSelectedClientId(null);
                    setSearchParams({ tab: 'invoices', action: 'detail', id: invoiceId });
                  }}
                  onNavigateToInvoiceCreate={(clientId) => {
                    setSelectedClientId(null);
                    setSearchParams({ tab: 'invoices', action: 'create', clientId: clientId });
                  }}
                  onAddNotification={addNotification}
                />
              ) : (
                <>
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

                  {/* Top Stats Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Clients */}
                    <GlassCard className="p-5 bg-gradient-to-br from-white to-slate-50/80 border border-navy/5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Total Clients</span>
                        <div className="p-1.5 bg-navy/5 rounded-lg">
                          <Users className="h-3.5 w-3.5 text-navy/60" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-navy">{filteredClients.length}</p>
                      <p className="text-[11px] font-semibold text-text-secondary">Registered profiles</p>
                    </GlassCard>

                    {/* Total Billed */}
                    <GlassCard className="p-5 bg-gradient-to-br from-white to-green/5 border border-green/10 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:border-green/20 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Total Billed Portfolio</span>
                        <div className="p-1.5 bg-green/10 rounded-lg">
                          <FileText className="h-3.5 w-3.5 text-green" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-green-dark">
                        {formatINR(filteredClients.reduce((sum, c) => sum + (c.totalBilled || 0), 0))}
                      </p>
                      <p className="text-[11px] font-semibold text-text-secondary">Total invoiced amount</p>
                    </GlassCard>

                    {/* Outstanding Receivables */}
                    <GlassCard className={`p-5 shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${filteredClients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0) > 0 ? 'bg-gradient-to-br from-white to-amber-500/5 border border-amber-500/15 hover:border-amber-500/25 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]' : 'bg-gradient-to-br from-white to-slate-50 border border-navy/5 hover:border-navy/15'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Portfolio Outstanding</span>
                        <div className={`p-1.5 rounded-lg ${filteredClients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0) > 0 ? 'bg-amber-500/10' : 'bg-navy/5'}`}>
                          <Clock className={`h-3.5 w-3.5 ${filteredClients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0) > 0 ? 'text-amber-600' : 'text-navy/60'}`} />
                        </div>
                      </div>
                      <p className={`text-2xl font-extrabold ${filteredClients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0) > 0 ? 'text-amber-600' : 'text-navy'}`}>
                        {formatINR(filteredClients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0))}
                      </p>
                      <p className="text-[11px] font-semibold text-text-secondary">Outstanding balance</p>
                    </GlassCard>
                  </div>

                  {/* Control panel: search, sort, filters */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    {/* Search bar */}
                    <div className="relative max-w-md w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search clients by name, email, company, or tax ID..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green focus:ring-1 focus:ring-green transition-all font-semibold"
                      />
                    </div>

                    {/* Sorting & Filters */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary whitespace-nowrap">Sort By:</span>
                        <select
                          value={clientSortBy}
                          onChange={(e) => { setClientSortBy(e.target.value as any); }}
                          className="px-3 py-2 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green transition-all font-semibold cursor-pointer"
                        >
                          <option value="name">Name (A–Z)</option>
                          <option value="date">Date Added</option>
                          <option value="outstanding">Outstanding</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary whitespace-nowrap">Country:</span>
                        <select
                          value={clientCountryFilter}
                          onChange={(e) => { setClientCountryFilter(e.target.value); }}
                          className="px-3 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green transition-all font-semibold cursor-pointer"
                        >
                          <option value="All">All Countries</option>
                          {uniqueCountries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary whitespace-nowrap">Status:</span>
                        <select
                          value={clientStatusFilter}
                          onChange={(e) => { setClientStatusFilter(e.target.value as any); }}
                          className="px-3 py-2.5 text-xs rounded-xl border border-navy/10 bg-white text-navy focus:outline-none focus:border-green transition-all font-semibold cursor-pointer"
                        >
                          <option value="active">Active Profiles</option>
                          <option value="archived">Archived (History)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main Clients Table Card list */}
                  <GlassCard className="overflow-hidden border-navy/5 shadow-sm min-h-[400px] flex flex-col bg-white">
                    {loading ? (
                      <div className="flex-1 flex flex-col gap-4 justify-center items-center py-16">
                        <div className="w-10 h-10 border-4 border-green/20 border-t-green rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-text-secondary animate-pulse">Retrieving isolated tenant lists...</span>
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
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
                      <div className="overflow-x-auto w-full flex-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-navy/5 bg-[#F8FAFC]">
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">Client</th>
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider">GST / Tax ID</th>
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-right">Billed</th>
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-right">Paid</th>
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-right">Outstanding</th>
                              <th className="py-4 px-6 text-xs font-extrabold uppercase text-text-secondary tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-navy/5 text-navy font-semibold">
                            {filteredClients.map((client) => (
                              <tr
                                key={client._id}
                                className="hover:bg-navy/5 transition-colors cursor-pointer"
                                onClick={() => setSelectedClientId(client._id)}
                              >
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-green/20 to-green-mint/30 flex items-center justify-center text-green-dark font-extrabold text-[10px]">
                                      {client.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-sm truncate">{client.name}</span>
                                        {client.isArchived && (
                                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-md text-[9px] font-extrabold uppercase tracking-wider select-none">
                                            Archived
                                          </span>
                                        )}
                                      </div>
                                      {client.companyName && (
                                        <span className="text-[10px] font-semibold text-green-dark truncate">{client.companyName}</span>
                                      )}
                                      <span className="text-[10px] font-semibold text-text-secondary lowercase truncate">{client.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  {(client.gstNumber || client.taxId) ? (
                                    <span className="font-mono text-[10px] bg-green/10 text-green-dark border border-green/20 px-2.5 py-0.5 rounded-full font-bold">
                                      {client.gstNumber || client.taxId}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-text-secondary font-medium italic">Not set</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right font-extrabold text-navy">
                                  {client.totalBilled !== undefined ? formatINR(client.totalBilled) : '—'}
                                </td>
                                <td className="py-4 px-6 text-right font-semibold text-green-dark">
                                  {client.totalPaid !== undefined ? formatINR(client.totalPaid) : '—'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className={`font-bold ${(client.totalOutstanding ?? 0) > 0 ? 'text-amber-600 font-extrabold' : 'text-navy/70'}`}>
                                    {client.totalOutstanding !== undefined ? formatINR(client.totalOutstanding) : '—'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => setSelectedClientId(client._id)}
                                      title="View Details"
                                      className="p-1.5 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
                                    >
                                      <Eye className="h-4.5 w-4.5" />
                                    </button>
                                    {!client.isArchived ? (
                                      <>
                                        <button
                                          onClick={() => openEditClientModal(client)}
                                          title="Edit Client"
                                          className="p-1.5 hover:bg-navy/5 rounded-lg text-text-secondary hover:text-navy transition-all"
                                        >
                                          <Edit2 className="h-4.5 w-4.5" />
                                        </button>
                                        <button
                                          onClick={() => setIsDeletingClient(client)}
                                          title="Archive Client"
                                          className="p-1.5 hover:bg-amber-500/10 rounded-lg text-text-secondary hover:text-amber-600 transition-all"
                                        >
                                          <Archive className="h-4.5 w-4.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleReactivateClient(client)}
                                        title="Reactivate Client"
                                        className="p-1.5 hover:bg-green/10 rounded-lg text-text-secondary hover:text-green-dark transition-all"
                                      >
                                        <RotateCcw className="h-4.5 w-4.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </GlassCard>
                </>
              )}
            </div>
          ) : activeTab === 'settings' || activeTab === 'profile' ? (
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
              
              {/* Name & Company Name grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Contact Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                  />
                </div>

                {/* Company Name field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Company / Org Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp Pvt Ltd"
                    value={clientForm.companyName}
                    onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold"
                  />
                </div>
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

                {/* Country field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Country</label>
                  <select
                    value={clientForm.country}
                    onChange={(e) => setClientForm({ ...clientForm, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold cursor-pointer"
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="UAE">UAE</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GST Number field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">GST Number (GSTIN)</label>
                  <input
                    type="text"
                    placeholder="27AAACR5055K1Z5"
                    value={clientForm.gstNumber}
                    onChange={(e) => setClientForm({ ...clientForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold font-mono"
                  />
                </div>

                {/* Tax ID field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary">Tax ID / VAT (Other)</label>
                  <input
                    type="text"
                    placeholder="Generic tax identifier"
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
                  rows={2}
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-navy/10 bg-[#F8FAFC] text-navy focus:outline-none focus:border-green focus:bg-white transition-all font-semibold resize-none"
                />
              </div>

              {/* Notes field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary">Internal Notes / Special Instructions</label>
                <textarea
                  placeholder="e.g. Always include PO number on invoices, net-30 terms..."
                  rows={2}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
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
            
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full mx-auto w-16 h-16 flex items-center justify-center">
              <Archive className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-navy">Archive Client Profile</h3>
              <p className="text-xs text-text-secondary font-semibold mt-2 leading-relaxed">
                Are you sure you want to archive client <strong>{isDeletingClient.name}</strong>? 
                This will deactivate them and hide them from active lists, but all historical invoices and billing records will be kept.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setIsDeletingClient(null)}
                className="py-2.5 px-4 text-xs font-bold border-navy/10 text-navy hover:bg-navy/5"
              >
                No, Keep Active
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteClient}
                className="py-2.5 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-sm"
              >
                Yes, Archive Client
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Reports locked feature overview Modal */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 bg-[#06121E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 md:p-8 flex flex-col gap-5 text-center animate-float-fast">
            <div className="p-4 bg-green/10 text-green rounded-full mx-auto w-16 h-16 flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-navy">Reports & Advanced Analytics</h3>
              <span className="text-[10px] bg-green/15 text-green-dark border border-green/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">
                Premium Pro Feature
              </span>
              <p className="text-xs text-text-secondary font-semibold mt-3.5 leading-relaxed">
                Unlock advanced financial reporting tools designed to simplify your bookkeeping and business analytics:
              </p>
              <ul className="text-left text-xs font-semibold text-navy/80 mt-4 flex flex-col gap-2 bg-[#F8FAFC] p-4 rounded-2xl border border-navy/5">
                <li className="flex items-center gap-2">
                  <span className="text-green font-bold">✓</span> GST/Tax ready report exports
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green font-bold">✓</span> Dynamic Profit & Loss statements
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green font-bold">✓</span> Multi-currency invoicing charts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green font-bold">✓</span> Automatic CSV & PDF invoice backups
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2.5 pt-3">
              <Button
                variant="primary"
                onClick={() => setIsReportsModalOpen(false)}
                className="w-full py-3 text-xs font-bold shadow-md"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardStub;
