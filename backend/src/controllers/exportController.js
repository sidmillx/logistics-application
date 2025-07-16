import { generateFullReport } from '../utils/exportService.js';
import { eq, and, gte, lte } from 'drizzle-orm';

export const exportFullReport = async (req, res) => {
  try {
    const { scope, dateFrom, dateTo, driverId, vehicleId, entityId } = req.query;
    
    const filters = {
      scope,
      dateFrom,
      dateTo,
      driverId,
      vehicleId,
      entityId
    };

    const workbook = await generateFullReport(filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=fleet-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
};