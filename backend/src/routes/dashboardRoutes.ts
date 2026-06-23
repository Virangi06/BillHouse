import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DashboardService } from '../services/dashboardService';
import AuditLog from '../models/AuditLog';
import Business from '../models/Business';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;

    // Fetch dynamic dashboard elements via DashboardService (scoped to tenantId)
    const metrics = await DashboardService.getDashboardMetrics(tenantId);
    const revenueTrendData = await DashboardService.getRevenueAnalytics(tenantId);
    const recentInvoices = await DashboardService.getRecentInvoices(tenantId);
    const recentActivity = await DashboardService.getRecentActivity(tenantId);

    return res.status(200).json({
      totalRevenue: metrics.totalRevenue,
      outstanding: metrics.outstandingAmount, // Map outstandingAmount to outstanding to align with frontend expectations
      paidInvoicesCount: metrics.paidInvoicesCount,
      overdueInvoicesCount: metrics.overdueInvoicesCount,
      statusDistribution: metrics.statusDistribution,
      revenueTrendData,
      recentInvoices,
      recentActivity,
      clientsCount: metrics.activeClientsCount,
      sparklineRevenue: metrics.sparklineRevenue,
      sparklineOutstanding: metrics.sparklineOutstanding,
      sparklinePaid: metrics.sparklinePaid,
      sparklineOverdue: metrics.sparklineOverdue,
      trends: metrics.trends
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return res.status(500).json({ error: 'Server error retrieving dashboard statistics' });
  }
});

// GET /api/dashboard/audit-logs
// Returns the last 50 audit log entries for the tenant (newest first).
// Optional query param: ?action=INVOICE_CREATED to filter by action type.
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;
    const { action, limit } = req.query;

    const query: any = { tenantId };
    if (action && typeof action === 'string') {
      query.action = action.toUpperCase();
    }

    const maxLimit = Math.min(parseInt(limit as string) || 50, 200);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(maxLimit)
      .select('-__v');

    return res.status(200).json({ logs, total: logs.length });
  } catch (error) {
    console.error('❌ Audit logs fetch error:', error);
    return res.status(500).json({ error: 'Server error retrieving audit logs' });
  }
});

// GET /api/dashboard/reports
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.user;

    // Check if tenant has Pro status
    const business = await Business.findOne({ tenantId });
    if (!business || !business.isPro) {
      return res.status(403).json({ error: 'Premium feature. Upgrade to the Pro Plan to unlock Reports & Analytics.' });
    }

    const { startDate, endDate } = req.query;
    const reportsData = await DashboardService.getReportsAnalytics(
      tenantId,
      startDate as string | undefined,
      endDate as string | undefined
    );
    return res.status(200).json(reportsData);
  } catch (error) {
    console.error('❌ Dashboard reports fetch error:', error);
    return res.status(500).json({ error: 'Server error retrieving reports data' });
  }
});

export default router;
