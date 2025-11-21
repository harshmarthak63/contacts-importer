import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ParsedFileData } from '@/types';

export async function parseFile(file: File): Promise<ParsedFileData> {
  try {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      return await parseCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await parseExcel(file);
    } else {
      throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
    }
  } catch (error: any) {
    console.error('Error parsing file:', error);
    throw new Error(error.message || 'Failed to parse file. Please ensure the file is valid.');
  }
}

function parseCSV(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (results.errors.length > 0 && results.data.length === 0) {
              reject(new Error('Failed to parse CSV file. The file may be corrupted or empty.'));
              return;
            }
            
            const headers = results.meta.fields || [];
            if (headers.length === 0) {
              reject(new Error('CSV file has no headers. Please ensure the first row contains column names.'));
              return;
            }
            
            const rows = results.data as Record<string, any>[];
            if (rows.length === 0) {
              reject(new Error('CSV file contains no data rows.'));
              return;
            }
            
            resolve({ headers, rows });
          } catch (error: any) {
            console.error('Error processing CSV results:', error);
            reject(new Error(`Failed to process CSV data: ${error.message || 'Unknown error'}`));
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(new Error(`Failed to parse CSV file: ${error.message || 'Unknown error'}`));
        },
      });
    } catch (error: any) {
      console.error('Error initializing CSV parser:', error);
      reject(new Error(`Failed to initialize CSV parser: ${error.message || 'Unknown error'}`));
    }
  });
}

async function parseExcel(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            reject(new Error('Failed to read Excel file. File may be corrupted.'));
            return;
          }

          const data = new Uint8Array(e.target.result as ArrayBuffer);
          let workbook: XLSX.WorkBook;
          
          try {
            workbook = XLSX.read(data, { type: 'array' });
          } catch (error: any) {
            reject(new Error(`Failed to read Excel file: ${error.message || 'Invalid file format'}`));
            return;
          }
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error('Excel file contains no sheets.'));
            return;
          }
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (!worksheet) {
            reject(new Error('Excel file sheet is empty or corrupted.'));
            return;
          }
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty.'));
            return;
          }
          
          if (jsonData.length === 1) {
            reject(new Error('Excel file contains only headers. Please add data rows.'));
            return;
          }
          
          const headers = (jsonData[0] as any[]).map(String).filter(h => h);
          
          if (headers.length === 0) {
            reject(new Error('Excel file has no headers. Please ensure the first row contains column names.'));
            return;
          }
          
          const rows = jsonData.slice(1).map((row: any) => {
            try {
              const obj: Record<string, any> = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] !== undefined ? row[index] : '';
              });
              return obj;
            } catch (error: any) {
              console.error('Error processing row:', error);
              return null;
            }
          }).filter(row => row !== null && Object.values(row).some(val => val !== '' && val !== null && val !== undefined));
          
          if (rows.length === 0) {
            reject(new Error('Excel file contains no valid data rows.'));
            return;
          }
          
          resolve({ headers, rows });
        } catch (error: any) {
          console.error('Error processing Excel file:', error);
          reject(new Error(`Failed to process Excel file: ${error.message || 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file. Please ensure the file is not corrupted.'));
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted.'));
      };
      
      try {
        reader.readAsArrayBuffer(file);
      } catch (error: any) {
        reject(new Error(`Failed to read file: ${error.message || 'Unknown error'}`));
      }
    } catch (error: any) {
      console.error('Error initializing Excel parser:', error);
      reject(new Error(`Failed to initialize Excel parser: ${error.message || 'Unknown error'}`));
    }
  });
}
