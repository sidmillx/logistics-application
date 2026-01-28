import { generateFullReport } from '../utils/exportService.js';
import { eq, and, gte, lte } from 'drizzle-orm';

// export const exportFullReport = async (req, res) => {
//   try {
//     const { 
//       scope, 
//       dateFrom, 
//       dateTo, 
//       driverId, 
//       vehicleId, 
//       entityId,
//       // Add these parameters for include flags
//       include_trips,
//       include_fuel,
//       include_drivers,
//       include_vehicles,
//       // Also support the date range parameters from your frontend modal
//       customDateFrom,
//       customDateTo
//     } = req.query;
    
//     // Determine which reports to include
//     // Default to true if parameter is not provided (for backward compatibility)
//     const includeFlags = {
//       trips: include_trips === 'true' || include_trips === undefined,
//       fuel: include_fuel === 'true' || include_fuel === undefined,
//       drivers: include_drivers === 'true' || include_drivers === undefined,
//       vehicles: include_vehicles === 'true' || include_vehicles === undefined
//     };
    
//     // Use custom date range if provided (from the modal)
//     const actualDateFrom = customDateFrom || dateFrom;
//     const actualDateTo = customDateTo || dateTo;
    
//     const filters = {
//       scope,
//       dateFrom: actualDateFrom,
//       dateTo: actualDateTo,
//       driverId,
//       vehicleId,
//       entityId,
//       // Pass the include flags to generateFullReport
//       includeFlags
//     };

//     const workbook = await generateFullReport(filters);

//     // Create a descriptive filename based on included reports
//     const includedReports = Object.entries(includeFlags)
//       .filter(([_, included]) => included)
//       .map(([report]) => report);
    
//     const reportsStr = includedReports.length > 0 
//       ? includedReports.join('-') 
//       : 'all';
    
//     const timestamp = new Date().toISOString().slice(0, 10);
//     const filename = `fleet-report-${reportsStr}-${timestamp}.xlsx`;

//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=${filename}`
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error('Export error:', error);
//     res.status(500).json({ error: 'Failed to generate export' });
//   }
// };




export const exportFullReport = async (req, res) => {
  try {
    const { 
      scope, 
      dateFrom, 
      dateTo, 
      driverId, 
      vehicleId, 
      entityId,
      // Add these parameters for include flags
      include_trips,
      include_fuel,
      include_drivers,
      include_vehicles,
      // Also support the date range parameters from your frontend modal
      customDateFrom,
      customDateTo
    } = req.query;
    
    // DEBUG: Log what parameters we're receiving
    console.log('Export parameters received:', {
      include_trips,
      include_fuel,
      include_drivers,
      include_vehicles,
      customDateFrom,
      customDateTo,
      scope,
      dateFrom,
      dateTo
    });
    
    // Determine which reports to include
    // IMPORTANT: When parameter is not provided, it should be false, not true
    const includeFlags = {
      trips: include_trips === 'true',
      fuel: include_fuel === 'true',
      drivers: include_drivers === 'true',
      vehicles: include_vehicles === 'true'
    };
    
    // DEBUG: Log the parsed flags
    console.log('Parsed include flags:', includeFlags);
    
    // Check if any reports are selected
    const hasSelectedReports = Object.values(includeFlags).some(include => include);
    if (!hasSelectedReports) {
      return res.status(400).json({ 
        error: "No report types selected. Please select at least one report type to export." 
      });
    }
    
    // Use custom date range if provided (from the modal)
    const actualDateFrom = customDateFrom || dateFrom;
    const actualDateTo = customDateTo || dateTo;
    
    const filters = {
      scope,
      dateFrom: actualDateFrom,
      dateTo: actualDateTo,
      driverId,
      vehicleId,
      entityId,
      // Pass the include flags to generateFullReport
      includeFlags
    };

    console.log('Filters passed to generateFullReport:', filters);

    const workbook = await generateFullReport(filters);

    // Create a descriptive filename based on included reports
    const includedReports = Object.entries(includeFlags)
      .filter(([_, included]) => included)
      .map(([report]) => report);
    
    const reportsStr = includedReports.length > 0 
      ? includedReports.join('-') 
      : 'all';
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `fleet-report-${reportsStr}-${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
};