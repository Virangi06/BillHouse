import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DashboardService } from '../services/dashboardService';

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

export default router;
