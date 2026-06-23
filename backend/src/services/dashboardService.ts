import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Client from '../models/Client';

export class DashboardService {
  // Method to get dashboard metrics (KPIs, status counts, trends and sparkline arrays)
  static async getDashboardMetrics(tenantId: string) {
    // 1. Total Revenue: Sum of all completed payments for current tenant
    const paymentAgg = await Payment.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = paymentAgg.length > 0 ? paymentAgg[0].total : 0;

    // 2. Outstanding Amount: Sum of amountDue for all unpaid/sent/viewed/overdue invoices
    const invoiceAgg = await Invoice.aggregate([
      { $match: { tenantId, status: { $nin: ['Paid', 'Draft'] } } },
      { $group: { _id: null, total: { $sum: '$amountDue' } } }
    ]);
    const outstandingAmount = invoiceAgg.length > 0 ? invoiceAgg[0].total : 0;

    // 3. Paid Invoices Count
    const paidInvoicesCount = await Invoice.countDocuments({ tenantId, status: 'Paid' });

    // 4. Overdue Invoices Count
    const overdueInvoicesCount = await Invoice.countDocuments({ tenantId, status: 'Overdue' });

    // 5. Active Clients Count
    const activeClientsCount = await Client.countDocuments({ tenantId });

    // Donut Status distribution chart counts
    const invoices = await Invoice.find({ tenantId });
    const statusCounts = { Paid: 0, Sent: 0, Viewed: 0, Overdue: 0 };
    invoices.forEach(inv => {
      if (inv.status in statusCounts) {
        statusCounts[inv.status as keyof typeof statusCounts]++;
      }
    });

    const statusDistribution = [
      { name: 'Paid', value: statusCounts.Paid, color: '#2F8F7A' },
      { name: 'Sent', value: statusCounts.Sent, color: '#0C4737' },
      { name: 'Viewed', value: statusCounts.Viewed, color: '#BEE8D8' },
      { name: 'Overdue', value: statusCounts.Overdue, color: '#E76F51' }
    ];

    // Compute trends comparison (this month vs last month)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let thisMonthOutstanding = 0;
    let lastMonthOutstanding = 0;
    let thisMonthPaidCount = 0;
    let lastMonthPaidCount = 0;
    let thisMonthOverdueCount = 0;
    let lastMonthOverdueCount = 0;

    const payments = await Payment.find({ tenantId });
    payments.forEach(pay => {
      const payDate = new Date(pay.date);
      if (payDate >= thirtyDaysAgo && payDate <= now) {
        thisMonthRevenue += pay.amount;
      } else if (payDate >= sixtyDaysAgo && payDate < thirtyDaysAgo) {
        lastMonthRevenue += pay.amount;
      }
    });

    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const isThisMonth = invDate >= thirtyDaysAgo && invDate <= now;
      const isLastMonth = invDate >= sixtyDaysAgo && invDate < thirtyDaysAgo;

      if (isThisMonth) {
        if (inv.status === 'Paid') {
          thisMonthPaidCount++;
        } else if (inv.status === 'Overdue') {
          thisMonthOverdueCount++;
          thisMonthOutstanding += inv.amountDue;
        } else if (inv.status !== 'Draft') {
          thisMonthOutstanding += inv.amountDue;
        }
      } else if (isLastMonth) {
        if (inv.status === 'Paid') {
          lastMonthPaidCount++;
        } else if (inv.status === 'Overdue') {
          lastMonthOverdueCount++;
          lastMonthOutstanding += inv.amountDue;
        } else if (inv.status !== 'Draft') {
          lastMonthOutstanding += inv.amountDue;
        }
      }
    });

    const getPercentageChange = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const trends = {
      revenueChange: getPercentageChange(thisMonthRevenue, lastMonthRevenue),
      outstandingChange: getPercentageChange(thisMonthOutstanding, lastMonthOutstanding),
      paidChange: getPercentageChange(thisMonthPaidCount, lastMonthPaidCount),
      overdueChange: thisMonthOverdueCount - lastMonthOverdueCount
    };

    // Calculate dynamic 6-point sparkline arrays based on actual 30-day records
    const sparklineRevenue = [0, 0, 0, 0, 0, 0];
    const sparklineOutstanding = [0, 0, 0, 0, 0, 0];
    const sparklinePaid = [0, 0, 0, 0, 0, 0];
    const sparklineOverdue = [0, 0, 0, 0, 0, 0];

    payments.forEach(pay => {
      const payDate = new Date(pay.date);
      const diffDays = Math.floor((now.getTime() - payDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const idx = 5 - Math.floor(diffDays / 5);
        if (idx >= 0 && idx < 6) {
          sparklineRevenue[idx] += pay.amount;
        }
      }
    });

    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const idx = 5 - Math.floor(diffDays / 5);
        if (idx >= 0 && idx < 6) {
          if (inv.status === 'Paid') {
            sparklinePaid[idx]++;
          } else if (inv.status === 'Overdue') {
            sparklineOverdue[idx]++;
            sparklineOutstanding[idx] += inv.amountDue;
          } else if (inv.status !== 'Draft') {
            sparklineOutstanding[idx] += inv.amountDue;
          }
        }
      }
    });

    return {
      totalRevenue,
      outstandingAmount,
      paidInvoicesCount,
      overdueInvoicesCount,
      activeClientsCount,
      statusDistribution,
      sparklineRevenue: sparklineRevenue.map(val => ({ v: val })),
      sparklineOutstanding: sparklineOutstanding.map(val => ({ v: val })),
      sparklinePaid: sparklinePaid.map(val => ({ v: val })),
      sparklineOverdue: sparklineOverdue.map(val => ({ v: val })),
      trends
    };
  }

  static async getRevenueAnalytics(tenantId: string) {
    const now = new Date();
    const points: Array<{ date: Date; day: string; value: number }> = [];
    const dNow = new Date(now);
    for (let i = 4; i >= 0; i--) {
      const d = new Date(dNow);
      d.setDate(dNow.getDate() - i * 7);
      points.push({
        date: d,
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0
      });
    }

    const invoices = await Invoice.find({ tenantId });
    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      let closestIdx = 0;
      let minDiff = Infinity;
      points.forEach((pt, idx) => {
        const diff = Math.abs(invDate.getTime() - pt.date.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      points[closestIdx].value += inv.totalAmount;
    });

    return points.map(({ day, value }) => ({ day, value }));
  }

  // Method to get recent invoices (limit 5)
  static async getRecentInvoices(tenantId: string) {
    return await Invoice.find({ tenantId })
      .sort({ date: -1 })
      .limit(5);
  }

  // Method to get recent activity dynamically from actual database records
  static async getRecentActivity(tenantId: string) {
    const activity: Array<{ type: string; message: string; meta: string; time: string; color: string; timestamp: Date }> = [];

    // 1. Clients Created
    const recentClients = await Client.find({ tenantId }).sort({ createdAt: -1 }).limit(3);
    recentClients.forEach(c => {
      activity.push({
        type: 'client_created',
        message: `Client ${c.name} registered`,
        meta: `Email: ${c.email}`,
        time: formatTimeAgo(c.createdAt),
        color: '#BEE8D8',
        timestamp: c.createdAt
      });
    });

    // 2. Invoices Created / Paid / Sent
    const recentInvoices = await Invoice.find({ tenantId }).sort({ updatedAt: -1 }).limit(5);
    recentInvoices.forEach(inv => {
      const timeAgo = formatTimeAgo(inv.updatedAt || inv.date);
      const timestamp = inv.updatedAt || inv.date;
      if (inv.status === 'Paid') {
        activity.push({
          type: 'invoice_paid',
          message: `Invoice #${inv.number} was paid`,
          meta: `by ${inv.clientName} • UPI/Bank`,
          time: timeAgo,
          color: '#2F8F7A',
          timestamp
        });
      } else if (inv.status === 'Sent') {
        activity.push({
          type: 'invoice_sent',
          message: `Invoice #${inv.number} sent to client`,
          meta: `to ${inv.clientName}`,
          time: timeAgo,
          color: '#0C4737',
          timestamp
        });
      } else {
        activity.push({
          type: 'invoice_created',
          message: `Invoice #${inv.number} created`,
          meta: `Amount: ₹${inv.totalAmount.toLocaleString('en-IN')}`,
          time: timeAgo,
          color: '#5F6B76',
          timestamp
        });
      }
    });

    // 3. Payments Received
    const recentPayments = await Payment.find({ tenantId }).sort({ date: -1 }).limit(3);
    recentPayments.forEach(p => {
      activity.push({
        type: 'payment_received',
        message: `Payment of ₹${p.amount.toLocaleString('en-IN')} received`,
        meta: `Method: ${p.method} • Txn: ${p.transactionId || 'N/A'}`,
        time: formatTimeAgo(p.date),
        color: '#2F8F7A',
        timestamp: p.date
      });
    });

    // Sort all activities by real date desc and return the top 5
    return activity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(({ type, message, meta, time, color }) => ({ type, message, meta, time, color }));
  }

  // Method to fetch reports and analytics metrics for Pro users
  static async getReportsAnalytics(tenantId: string, startDate?: string, endDate?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = { tenantId, status: { $ne: 'Cancelled' } };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Fetch all active invoices (excluding Cancelled)
    const invoices = await Invoice.find(query);

    // 1. Core aggregates
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalGstCollected = 0;
    let totalTdsDeducted = 0;

    invoices.forEach(inv => {
      totalInvoiced += inv.totalAmount || 0;
      totalCollected += inv.amountPaid || 0;
      totalOutstanding += inv.amountDue || 0;
      totalGstCollected += inv.gstAmount || 0;
      totalTdsDeducted += inv.tdsAmount || 0;
    });

    // Rounding sums
    totalInvoiced = Math.round(totalInvoiced * 100) / 100;
    totalCollected = Math.round(totalCollected * 100) / 100;
    totalOutstanding = Math.round(totalOutstanding * 100) / 100;
    totalGstCollected = Math.round(totalGstCollected * 100) / 100;
    totalTdsDeducted = Math.round(totalTdsDeducted * 100) / 100;

    // 2. Compute billing performance & tax breakdown
    // Generate month ranges between startDate and endDate or default to past 6 months
    let startD = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    if (startDate) {
      startD = new Date(startDate);
      startD.setDate(1);
    }
    
    let endD = new Date(today);
    if (endDate) {
      endD = new Date(endDate);
    }

    const diffMonths = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth()) + 1;
    const count = Math.min(Math.max(1, diffMonths), 24);

    const monthlyBilling: any[] = [];
    const monthlyTax: any[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(startD.getFullYear(), startD.getMonth() + i, 1);
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      
      monthlyBilling.push({
        month: monthLabel,
        billed: 0,
        collected: 0,
        year: d.getFullYear(),
        monthNum: d.getMonth()
      });

      monthlyTax.push({
        month: monthLabel,
        gst: 0,
        tds: 0,
        year: d.getFullYear(),
        monthNum: d.getMonth()
      });
    }

    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const idx = monthlyBilling.findIndex(m => m.year === invDate.getFullYear() && m.monthNum === invDate.getMonth());
      if (idx !== -1) {
        monthlyBilling[idx].billed += inv.totalAmount || 0;
        monthlyBilling[idx].collected += inv.amountPaid || 0;
        monthlyTax[idx].gst += inv.gstAmount || 0;
        monthlyTax[idx].tds += inv.tdsAmount || 0;
      }
    });

    // Clean monthNum/year tags before returning
    const billingTrend = monthlyBilling.map(({ month, billed, collected }) => ({
      month,
      billed: Math.round(billed),
      collected: Math.round(collected)
    }));

    const taxTrend = monthlyTax.map(({ month, gst, tds }) => ({
      month,
      gst: Math.round(gst),
      tds: Math.round(tds)
    }));

    // 3. Outstanding overdue aging list
    const overdueQuery: any = { tenantId, status: 'Overdue' };
    if (startDate || endDate) {
      overdueQuery.dueDate = {};
      if (startDate) overdueQuery.dueDate.$gte = new Date(startDate);
      if (endDate) overdueQuery.dueDate.$lte = new Date(endDate);
    }
    const overdueInvoices = await Invoice.find(overdueQuery)
      .sort({ dueDate: 1 }) // oldest first
      .select('number clientName totalAmount amountDue dueDate');

    const overdueAging = overdueInvoices.map(inv => {
      const dueDate = new Date(inv.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      return {
        _id: inv._id,
        number: inv.number,
        clientName: inv.clientName,
        totalAmount: inv.totalAmount,
        amountDue: inv.amountDue,
        dueDate: inv.dueDate,
        overdueDays
      };
    });

    // 4. Status distribution for analytics
    const statusCounts = { Paid: 0, Sent: 0, Viewed: 0, Overdue: 0, Draft: 0 };
    invoices.forEach(inv => {
      if (inv.status in statusCounts) {
        statusCounts[inv.status as keyof typeof statusCounts]++;
      }
    });
    const statusDistribution = [
      { name: 'Paid', value: statusCounts.Paid, color: '#2F8F7A' },
      { name: 'Sent', value: statusCounts.Sent, color: '#0C4737' },
      { name: 'Viewed', value: statusCounts.Viewed, color: '#BEE8D8' },
      { name: 'Overdue', value: statusCounts.Overdue, color: '#E76F51' },
      { name: 'Draft', value: statusCounts.Draft, color: '#5F6B76' }
    ];

    return {
      financials: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalGstCollected,
        totalTdsDeducted,
        invoiceCount: invoices.length
      },
      billingTrend,
      taxTrend,
      overdueAging,
      statusDistribution
    };
  }
}

function formatTimeAgo(dateInput: any) {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
