import ExcelJS from 'exceljs';

import { format } from 'date-fns';
import { db } from "../config/db.js"; // Your Drizzle DB instance
import { 
  usersTable, 
  entitiesTable, 
  drivers, 
  vehicles, 
  assignments, 
  trips, 
  fuelLogs, 
  supervisions, 
  supervisors,
  checkins,
  checkouts
} from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm'; // Import Drizzle query operators

const formatValue = (key, value) => {
  if (value === null || value === undefined) return 'N/A';
  
  // Date fields
  const dateColumns = [
    'created_at', 'updated_at', 'assigned_at', 
    'check_in_time', 'check_out_time', 'timestamp',
    'checked_in_at', 'checked_out_at'
  ];
  if (dateColumns.includes(key)) {
    return value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : 'N/A';
  }

  // Numeric fields
  const numericColumns = [
    'odometer_start', 'odometer_end', 'litres', 
    'cost', 'odometer', 'start_odometer', 'end_odometer'
  ];
  if (numericColumns.includes(key)) {
    return new Intl.NumberFormat().format(value);
  }

  return value.toString();
};

const getTripsData = async (filters = {}) => {
  return await db.select()
    .from(trips)
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .leftJoin(usersTable, eq(trips.driverId, usersTable.id))
    .where(and(
      filters.dateFrom ? gte(trips.checkInTime, filters.dateFrom) : undefined,
      filters.dateTo ? lte(trips.checkOutTime, filters.dateTo) : undefined,
      filters.driverId ? eq(trips.driverId, filters.driverId) : undefined,
      filters.vehicleId ? eq(trips.vehicleId, filters.vehicleId) : undefined
    ));
};

const getFuelData = async (filters = {}) => {
  return await db.select()
    .from(fuelLogs)
    .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
    .leftJoin(usersTable, eq(fuelLogs.loggedBy, usersTable.id))
    .where(and(
      filters.dateFrom ? gte(fuelLogs.timestamp, filters.dateFrom) : undefined,
      filters.dateTo ? lte(fuelLogs.timestamp, filters.dateTo) : undefined,
      filters.vehicleId ? eq(fuelLogs.vehicleId, filters.vehicleId) : undefined
    ));
};

const getDriversData = async (filters = {}) => {
  return await db.select()
    .from(drivers)
    .leftJoin(usersTable, eq(drivers.id, usersTable.id))
    .leftJoin(entitiesTable, eq(drivers.entityId, entitiesTable.id))
    .where(and(
      filters.dateFrom ? gte(drivers.createdAt, filters.dateFrom) : undefined,
      filters.dateTo ? lte(drivers.createdAt, filters.dateTo) : undefined,
      filters.driverId ? eq(drivers.id, filters.driverId) : undefined
    ));
};

const getVehiclesData = async (filters = {}) => {
  return await db.select()
    .from(vehicles)
    .leftJoin(entitiesTable, eq(vehicles.entityId, entitiesTable.id))
    .where(and(
      filters.dateFrom ? gte(vehicles.createdAt, filters.dateFrom) : undefined,
      filters.dateTo ? lte(vehicles.createdAt, filters.dateTo) : undefined,
      filters.vehicleId ? eq(vehicles.id, filters.vehicleId) : undefined,
      filters.entityId ? eq(vehicles.entityId, filters.entityId) : undefined
    ));
};



export const generateFullReport = async (filters) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fleet Management System';
  workbook.created = new Date();

  // Extract include flags from filters, defaulting to true if not provided
  const includeFlags = filters.includeFlags || {
    trips: true,
    fuel: true,
    drivers: true,
    vehicles: true
  };

  // Add Metadata sheet - always include this
  const metaSheet = workbook.addWorksheet('Metadata');
  metaSheet.columns = [
    { header: 'Key', key: 'key', width: 25 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  
  metaSheet.addRow({ key: 'Report Generated At', value: new Date().toISOString() });
  metaSheet.addRow({ key: 'Report Scope', value: filters.scope || 'All Records' });
  
  // List included reports in metadata
  const includedReports = Object.entries(includeFlags)
    .filter(([_, included]) => included)
    .map(([report]) => report.charAt(0).toUpperCase() + report.slice(1))
    .join(', ');
  metaSheet.addRow({ key: 'Included Reports', value: includedReports || 'None' });
  
  if (filters.dateFrom) metaSheet.addRow({ key: 'Date From', value: filters.dateFrom });
  if (filters.dateTo) metaSheet.addRow({ key: 'Date To', value: filters.dateTo });

  // Trips Report - only if included
  if (includeFlags.trips) {
    try {
      const tripsData = await getTripsData(filters);
      if (tripsData.length > 0) {
        const tripsSheet = workbook.addWorksheet('Trips');
        tripsSheet.columns = [
          { header: 'TRIP ID', key: 'id', width: 20 },
          { header: 'DRIVER', key: 'driver_name', width: 25 },
          { header: 'VEHICLE', key: 'plate_number', width: 20 },
          { header: 'START LOCATION', key: 'location_start', width: 25 },
          { header: 'END LOCATION', key: 'location_end', width: 25 },
          { header: 'START ODOMETER', key: 'odometer_start', width: 15 },
          { header: 'END ODOMETER', key: 'odometer_end', width: 15 },
          { header: 'CHECK IN', key: 'check_in_time', width: 20 },
          { header: 'CHECK OUT', key: 'check_out_time', width: 20 }
        ];
        
        tripsData.forEach(row => {
          tripsSheet.addRow({
            id: row.trips?.id || 'N/A',
            driver_name: row.users?.fullname || 'N/A',
            plate_number: row.vehicles?.plateNumber || 'N/A',
            ...Object.fromEntries(
              Object.entries(row.trips || {}).map(([key, value]) => 
                [key, formatValue(key, value)]
              )
            )
          });
        });
        
        // Add summary row
        const totalTrips = tripsData.length;
        tripsSheet.addRow({}); // Empty row
        tripsSheet.addRow({
          id: 'SUMMARY',
          driver_name: `Total Trips: ${totalTrips}`,
          plate_number: `Data Range: ${filters.dateFrom || 'N/A'} to ${filters.dateTo || 'N/A'}`
        });
      } else {
        // Add empty sheet with message if no data
        const tripsSheet = workbook.addWorksheet('Trips');
        tripsSheet.addRow({ id: 'No trip data found for the selected filters' });
      }
    } catch (error) {
      console.error('Error generating trips report:', error);
      const tripsSheet = workbook.addWorksheet('Trips');
      tripsSheet.addRow({ id: 'Error loading trips data' });
      tripsSheet.addRow({ id: error.message });
    }
  }

  // Fuel Report - only if included
  if (includeFlags.fuel) {
    try {
      const fuelData = await getFuelData(filters);
      
      if (fuelData?.length > 0) {
        const fuelSheet = workbook.addWorksheet('Fuel');
        fuelSheet.columns = [
          { header: 'LOG ID', key: 'id', width: 20 },
          { header: 'VEHICLE', key: 'plate_number', width: 20 },
          { header: 'LITRES', key: 'litres', width: 15 },
          { header: 'COST', key: 'cost', width: 15 },
          { header: 'ODOMETER', key: 'odometer', width: 15 },
          { header: 'LOCATION', key: 'location', width: 25 },
          { header: 'LOGGED BY', key: 'logged_by_name', width: 25 },
          { header: 'TIMESTAMP', key: 'timestamp', width: 20 }
        ];

        let totalLitres = 0;
        let totalCost = 0;

        fuelData.forEach(row => {
          if (!row?.fuelLogs) {
            console.warn("Skipping row - missing fuelLogs:", row);
            return;
          }

          fuelSheet.addRow({
            id: row.fuelLogs.id,
            plate_number: row.vehicles?.plateNumber || 'N/A',
            logged_by_name: row.users?.fullname || 'N/A',
            ...Object.fromEntries(
              Object.entries(row.fuelLogs).map(([key, value]) => 
                [key, formatValue(key, value)]
              )
            )
          });

          // Calculate totals
          if (row.fuelLogs.litres) totalLitres += parseFloat(row.fuelLogs.litres) || 0;
          if (row.fuelLogs.cost) totalCost += parseFloat(row.fuelLogs.cost) || 0;
        });

        // Add summary row
        fuelSheet.addRow({}); // Empty row
        fuelSheet.addRow({
          id: 'SUMMARY',
          plate_number: `Total Litres: ${totalLitres.toFixed(2)}`,
          litres: `Total Cost: ${totalCost.toFixed(2)}`,
          cost: `Average Cost/Litre: ${totalLitres > 0 ? (totalCost / totalLitres).toFixed(2) : 0}`
        });
      } else {
        const fuelSheet = workbook.addWorksheet('Fuel');
        fuelSheet.addRow({ id: 'No fuel data found for the selected filters' });
      }
    } catch (error) {
      console.error('Error generating fuel report:', error);
      const fuelSheet = workbook.addWorksheet('Fuel');
      fuelSheet.addRow({ id: 'Error loading fuel data' });
      fuelSheet.addRow({ id: error.message });
    }
  }

  // Drivers Report - only if included
  if (includeFlags.drivers) {
    try {
      const driversData = await getDriversData(filters);
      if (driversData.length > 0) {
        const driversSheet = workbook.addWorksheet('Drivers');
        driversSheet.columns = [
          { header: 'DRIVER ID', key: 'id', width: 20 },
          { header: 'FULL NAME', key: 'fullname', width: 25 },
          { header: 'USERNAME', key: 'username', width: 20 },
          { header: 'CONTACT', key: 'contact', width: 20 },
          { header: 'ENTITY', key: 'entity_name', width: 25 },
          { header: 'CREATED AT', key: 'created_at', width: 20 }
        ];
        
        driversData.forEach(row => {
          driversSheet.addRow({
            id: row.drivers?.id || 'N/A',
            fullname: row.users?.fullname || 'N/A',
            username: row.users?.username || 'N/A',
            contact: row.drivers?.contact || 'N/A',
            entity_name: row.entities?.name || 'N/A',
            created_at: formatValue('created_at', row.drivers?.createdAt)
          });
        });
        
        // Add summary row
        driversSheet.addRow({}); // Empty row
        driversSheet.addRow({
          id: 'SUMMARY',
          fullname: `Total Drivers: ${driversData.length}`,
          username: `Active Drivers: ${driversData.filter(d => d.drivers?.status === 'active').length}`
        });
      } else {
        const driversSheet = workbook.addWorksheet('Drivers');
        driversSheet.addRow({ id: 'No driver data found for the selected filters' });
      }
    } catch (error) {
      console.error('Error generating drivers report:', error);
      const driversSheet = workbook.addWorksheet('Drivers');
      driversSheet.addRow({ id: 'Error loading drivers data' });
      driversSheet.addRow({ id: error.message });
    }
  }

  // Vehicles Report - only if included
  if (includeFlags.vehicles) {
    try {
      const vehiclesData = await getVehiclesData(filters);
      if (vehiclesData.length > 0) {
        const vehiclesSheet = workbook.addWorksheet('Vehicles');
        vehiclesSheet.columns = [
          { header: 'VEHICLE ID', key: 'id', width: 20 },
          { header: 'PLATE NUMBER', key: 'plateNumber', width: 20 },
          { header: 'MODEL', key: 'model', width: 20 },
          { header: 'MAKE', key: 'make', width: 20 },
          { header: 'STATUS', key: 'status', width: 15 },
          { header: 'ENTITY', key: 'entity_name', width: 25 },
          { header: 'CREATED AT', key: 'created_at', width: 20 }
        ];
        
        vehiclesData.forEach(row => {
          vehiclesSheet.addRow({
            ...row.vehicles,
            entity_name: row.entities?.name || 'N/A',
            created_at: formatValue('created_at', row.vehicles?.createdAt)
          });
        });
        
        // Add summary row
        const activeVehicles = vehiclesData.filter(v => v.vehicles?.status === 'active').length;
        const inactiveVehicles = vehiclesData.filter(v => v.vehicles?.status === 'inactive').length;
        vehiclesSheet.addRow({}); // Empty row
        vehiclesSheet.addRow({
          id: 'SUMMARY',
          plateNumber: `Total Vehicles: ${vehiclesData.length}`,
          model: `Active: ${activeVehicles}`,
          make: `Inactive: ${inactiveVehicles}`
        });
      } else {
        const vehiclesSheet = workbook.addWorksheet('Vehicles');
        vehiclesSheet.addRow({ id: 'No vehicle data found for the selected filters' });
      }
    } catch (error) {
      console.error('Error generating vehicles report:', error);
      const vehiclesSheet = workbook.addWorksheet('Vehicles');
      vehiclesSheet.addRow({ id: 'Error loading vehicles data' });
      vehiclesSheet.addRow({ id: error.message });
    }
  }

  // If no report worksheets were added (all flags false), add a message
  if (workbook.worksheets.length === 1) { // Only metadata sheet exists
    const messageSheet = workbook.addWorksheet('Report Info');
    messageSheet.addRow({ id: 'No reports were selected for export.' });
    messageSheet.addRow({ id: 'Please select at least one report type in the export modal.' });
  }


  console.log("Using date range:", filters.dateFrom, "to", filters.dateTo);


  return workbook;
};
// export const generateFullReport = async (filters) => {

//   const workbook = new ExcelJS.Workbook();
//   workbook.creator = 'Fleet Management System';
//   workbook.created = new Date();

//   // Add Metadata sheet
//   const metaSheet = workbook.addWorksheet('Metadata');
//   metaSheet.columns = [
//     { header: 'Key', key: 'key', width: 25 },
//     { header: 'Value', key: 'value', width: 40 }
//   ];
  
//   metaSheet.addRow({ key: 'Report Generated At', value: new Date().toISOString() });
//   metaSheet.addRow({ key: 'Report Scope', value: filters.scope });
//   if (filters.dateFrom) metaSheet.addRow({ key: 'Date From', value: filters.dateFrom });
//   if (filters.dateTo) metaSheet.addRow({ key: 'Date To', value: filters.dateTo });

//   // Trips Report
//   const tripsData = await getTripsData(filters);
//   if (tripsData.length > 0) {
//     const tripsSheet = workbook.addWorksheet('Trips');
//     tripsSheet.columns = [
//       { header: 'TRIP ID', key: 'id', width: 20 },
//       { header: 'DRIVER', key: 'driver_name', width: 25 },
//       { header: 'VEHICLE', key: 'plate_number', width: 20 },
//       { header: 'START LOCATION', key: 'location_start', width: 25 },
//       { header: 'END LOCATION', key: 'location_end', width: 25 },
//       { header: 'START ODOMETER', key: 'odometer_start', width: 15 },
//       { header: 'END ODOMETER', key: 'odometer_end', width: 15 },
//       { header: 'CHECK IN', key: 'check_in_time', width: 20 },
//       { header: 'CHECK OUT', key: 'check_out_time', width: 20 }
//     ];
    
//     tripsData.forEach(row => {
//       tripsSheet.addRow({
//         id: row.trips.id,
//         driver_name: row.users?.fullname || 'N/A',
//         plate_number: row.vehicles?.plateNumber || 'N/A',
//         ...Object.fromEntries(
//           Object.entries(row.trips).map(([key, value]) => 
//             [key, formatValue(key, value)]
//           )
//         )
//       });
//     });
//   }

//   // Fuel Report
//   // Fuel Report
// const fuelData = await getFuelData(filters);

// if (fuelData?.length > 0) {
//   const fuelSheet = workbook.addWorksheet('Fuel');
//   fuelSheet.columns = [
//     { header: 'LOG ID', key: 'id', width: 20 },
//     { header: 'VEHICLE', key: 'plate_number', width: 20 },
//     { header: 'LITRES', key: 'litres', width: 15 },
//     { header: 'COST', key: 'cost', width: 15 },
//     { header: 'ODOMETER', key: 'odometer', width: 15 },
//     { header: 'LOCATION', key: 'location', width: 25 },
//     { header: 'LOGGED BY', key: 'logged_by_name', width: 25 },
//     { header: 'TIMESTAMP', key: 'timestamp', width: 20 }
//   ];

//   fuelData.forEach(row => {
//     if (!row?.fuelLogs) {
//       console.warn("Skipping row - missing fuelLogs:", row);
//       return;
//     }

//     fuelSheet.addRow({
//       id: row.fuelLogs.id,
//       plate_number: row.vehicles?.plateNumber || 'N/A',
//       logged_by_name: row.users?.fullname || 'N/A',
//       ...Object.fromEntries(
//         Object.entries(row.fuelLogs).map(([key, value]) => 
//           [key, formatValue(key, value)]
//         )
//       )
//     });
//   });
// }

//   // Drivers Report
//   const driversData = await getDriversData(filters);
//   if (driversData.length > 0) {
//     const driversSheet = workbook.addWorksheet('Drivers');
//     driversSheet.columns = [
//       { header: 'DRIVER ID', key: 'id', width: 20 },
//       { header: 'FULL NAME', key: 'fullname', width: 25 },
//       { header: 'USERNAME', key: 'username', width: 20 },
//       { header: 'CONTACT', key: 'contact', width: 20 },
//       { header: 'ENTITY', key: 'entity_name', width: 25 },
//       { header: 'CREATED AT', key: 'created_at', width: 20 }
//     ];
    
//     driversData.forEach(row => {
//       driversSheet.addRow({
//         id: row.drivers.id,
//         fullname: row.users?.fullname || 'N/A',
//         username: row.users?.username || 'N/A',
//         contact: row.drivers.contact,
//         entity_name: row.entities?.name || 'N/A',
//         created_at: formatValue('created_at', row.drivers.createdAt)
//       });
//     });
//   }

//   // Vehicles Report
//   const vehiclesData = await getVehiclesData(filters);
//   if (vehiclesData.length > 0) {
//     const vehiclesSheet = workbook.addWorksheet('Vehicles');
//     vehiclesSheet.columns = [
//       { header: 'VEHICLE ID', key: 'id', width: 20 },
//       { header: 'PLATE NUMBER', key: 'plateNumber', width: 20 },
//       { header: 'MODEL', key: 'model', width: 20 },
//       { header: 'MAKE', key: 'make', width: 20 },
//       { header: 'STATUS', key: 'status', width: 15 },
//       { header: 'ENTITY', key: 'entity_name', width: 25 },
//       { header: 'CREATED AT', key: 'created_at', width: 20 }
//     ];
    
//     vehiclesData.forEach(row => {
//       vehiclesSheet.addRow({
//         ...row.vehicles,
//         entity_name: row.entities?.name || 'N/A',
//         created_at: formatValue('created_at', row.vehicles.createdAt)
//       });
//     });
//   }

//   return workbook;
// };