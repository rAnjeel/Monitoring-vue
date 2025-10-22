import * as XLSX from 'xlsx';

export function exportJsonToExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[exportJsonToExcel] No data to export');
    return;
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const columnWidths = [];
    const headers = Object.keys(data[0] || {});
    
    headers.forEach((header, index) => {
      let maxLength = header.length;
      
      // Find the maximum length in this column
      data.forEach(row => {
        const cellValue = String(row[header] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // Set reasonable column width (min 10, max 50)
      columnWidths[index] = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    worksheet['!cols'] = columnWidths.map(width => ({ width }));
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
    
    console.log(`[exportJsonToExcel] Successfully exported ${data.length} rows to ${filename}`);
  } catch (error) {
    console.error('[exportJsonToExcel] Error exporting to Excel:', error);
    throw new Error(`Failed to export Excel file: ${error.message}`);
  }
}

// Alternative function for multiple sheets
export function exportJsonToExcelMultiSheet(sheets, filename = 'export.xlsx') {
  if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
    console.warn('[exportJsonToExcelMultiSheet] No sheets to export');
    return;
  }

  try {
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const { name, data } = sheet;
      
      if (!name || !Array.isArray(data) || data.length === 0) {
        console.warn(`[exportJsonToExcelMultiSheet] Skipping invalid sheet: ${name}`);
        return;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns for this sheet
      const columnWidths = [];
      const headers = Object.keys(data[0] || {});
      
      headers.forEach((header, index) => {
        let maxLength = header.length;
        
        data.forEach(row => {
          const cellValue = String(row[header] || '');
          maxLength = Math.max(maxLength, cellValue.length);
        });
        
        columnWidths[index] = Math.min(Math.max(maxLength + 2, 10), 50);
      });
      
      worksheet['!cols'] = columnWidths.map(width => ({ width }));
      
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });
    
    XLSX.writeFile(workbook, filename);
    
    console.log(`[exportJsonToExcelMultiSheet] Successfully exported ${sheets.length} sheets to ${filename}`);
  } catch (error) {
    console.error('[exportJsonToExcelMultiSheet] Error exporting to Excel:', error);
    throw new Error(`Failed to export Excel file: ${error.message}`);
  }
}

// Function to format data for Excel export with custom formatting
export function exportJsonToExcelFormatted(data, filename = 'export.xlsx', options = {}) {
  const {
    sheetName = 'Sheet1',
    headers = null, // Custom headers mapping
    dateColumns = [], // Columns that should be formatted as dates
    numberColumns = [], // Columns that should be formatted as numbers
    currencyColumns = [] // Columns that should be formatted as currency
  } = options;

  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[exportJsonToExcelFormatted] No data to export');
    return;
  }

  try {
    const workbook = XLSX.utils.book_new();
    
    // Process data with custom formatting
    let processedData = [...data];
    
    // Apply custom headers if provided
    if (headers) {
      processedData = data.map(row => {
        const newRow = {};
        Object.keys(headers).forEach(key => {
          newRow[headers[key]] = row[key];
        });
        return newRow;
      });
    }
    
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    
    // Apply formatting to specific columns
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const headerCell = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const headerValue = worksheet[headerCell]?.v;
        
        if (headerValue) {
          const cell = worksheet[cellAddress];
          
          // Format dates
          if (dateColumns.includes(headerValue) && cell?.v) {
            cell.z = 'mm/dd/yyyy hh:mm:ss';
          }
          
          // Format numbers
          if (numberColumns.includes(headerValue) && cell?.v) {
            cell.z = '#,##0.00';
          }
          
          // Format currency
          if (currencyColumns.includes(headerValue) && cell?.v) {
            cell.z = '$#,##0.00';
          }
        }
      }
    }
    
    // Auto-size columns
    const columnWidths = [];
    const headersList = Object.keys(processedData[0] || {});
    
    headersList.forEach((header, index) => {
      let maxLength = header.length;
      
      processedData.forEach(row => {
        const cellValue = String(row[header] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      columnWidths[index] = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    worksheet['!cols'] = columnWidths.map(width => ({ width }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
    
    console.log(`[exportJsonToExcelFormatted] Successfully exported ${data.length} rows to ${filename}`);
  } catch (error) {
    console.error('[exportJsonToExcelFormatted] Error exporting to Excel:', error);
    throw new Error(`Failed to export Excel file: ${error.message}`);
  }
}
