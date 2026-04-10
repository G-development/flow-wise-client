"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import Papa from "papaparse";
import { parse } from "date-fns";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";

interface csvRow {
  Type: string;
  Amount: string;
  Date: string;
  Category: string;
  Description: string;
}

export default function Import() {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    totalRows: number;
    errors: string[];
  } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    const loadingToast = toast.loading('Processing CSV file...');

    try {
      const fileText = await file.text();
      const firstLine = fileText.split(/\r?\n/)[0] ?? "";
      const delimiterCandidates = [",", ";", "\t", "|"];
      const detectedDelimiter = delimiterCandidates.find((delimiter) => firstLine.includes(delimiter)) ?? ",";
      const normalizeHeader = (header: string | undefined) =>
        header?.replace(/^\uFEFF/, "").trim() ?? "";

      let results = Papa.parse<csvRow>(fileText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
        delimiter: detectedDelimiter,
      });

      const requiredHeaders = ['Type', 'Amount', 'Date', 'Category', 'Description'];
      let headers = results.meta.fields || [];
      let missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0 && fileText.includes(';')) {
        results = Papa.parse<csvRow>(fileText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: normalizeHeader,
          delimiter: ';',
        });
        headers = results.meta.fields || [];
        missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
      }

      const rows = results.data;
      const errors: string[] = [];

      if (results.errors.length > 0) {
        results.errors.forEach((parseError) => {
          const rowNumber = typeof parseError.row === 'number' ? parseError.row + 1 : 'unknown';
          errors.push(`CSV parse error on row ${rowNumber}: ${parseError.message || 'Unknown parse error'}`);
        });
      }

      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
        toast.error('Invalid CSV format', { id: loadingToast });
        setImportResult({
          success: false,
          importedCount: 0,
          totalRows: rows.length,
          errors,
        });
        return;
      }

      const validRows = rows.filter((r, index) => {
        const rowNum = index + 2;
        const type = r.Type?.trim();
        const amount = parseFloat(r.Amount?.replace(',', '.') ?? '');
        const dateString = r.Date?.trim();
        const category = r.Category?.trim();
        const description = r.Description?.trim();

        if (!['I', 'E'].includes(type)) {
          errors.push(`Row ${rowNum}: Invalid Type "${r.Type}". Must be "I" or "E"`);
          return false;
        }

        if (Number.isNaN(amount)) {
          errors.push(`Row ${rowNum}: Invalid Amount "${r.Amount}"`);
          return false;
        }

        const parsedDate = parse(dateString ?? '', 'dd/MM/yyyy', new Date());
        if (Number.isNaN(parsedDate.getTime())) {
          errors.push(`Row ${rowNum}: Invalid Date "${r.Date}". Expected format: dd/MM/yyyy`);
          return false;
        }

        if (!category) {
          errors.push(`Row ${rowNum}: Missing Category`);
          return false;
        }

        if (!description) {
          errors.push(`Row ${rowNum}: Missing Description`);
          return false;
        }

        return true;
      });

      if (validRows.length === 0) {
        toast.error('No valid transactions found', { id: loadingToast });
        setImportResult({
          success: false,
          importedCount: 0,
          totalRows: rows.length,
          errors,
        });
        return;
      }

      toast.loading('Importing transactions...', { id: loadingToast });

      const res = await apiFetch('/import/csv', {
        method: 'POST',
        body: JSON.stringify({ csv: fileText }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(`Imported ${responseData.importedCount ?? validRows.length} transactions`, { id: loadingToast });
        setImportResult({
          success: true,
          importedCount: responseData.importedCount ?? validRows.length,
          totalRows: rows.length,
          errors: responseData.errors || errors,
        });
      } else {
        const responseErrors = Array.isArray(responseData.details)
          ? responseData.details
          : responseData.details
          ? [responseData.details]
          : responseData.error
          ? [responseData.error]
          : ['Import failed'];

        toast.error(responseErrors.join(' '), { id: loadingToast });
        setImportResult({
          success: false,
          importedCount: responseData.importedCount ?? 0,
          totalRows: rows.length,
          errors: [...errors, ...responseErrors],
        });
      }
    } catch (catchError) {
      const message = catchError instanceof Error ? catchError.message : 'Unexpected error occurred';
      toast.error(`Unexpected error during import: ${message}`, { id: loadingToast });
      setImportResult({
        success: false,
        importedCount: 0,
        totalRows: 0,
        errors: [message],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setImportResult(null);
    // Reset file input
    const fileInput = document.getElementById('csv') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-4 md:py-8 px-4 max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Import Transactions</h1>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to bulk import your financial transactions
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file containing your transactions data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="csv" className="text-sm font-medium">
                  CSV File
                </Label>
                <Input
                  id="csv"
                  accept=".csv"
                  type="file"
                  onChange={handleFile}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing file...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CSV Format Guide
              </CardTitle>
              <CardDescription>
                Your CSV file must follow this exact format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> Type, Amount, Date, Category, Description
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">Example CSV content:</p>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
{`Type,Amount,Date,Category,Description
I,261.88,02/04/2025,Salary,April salary
E,721.68,04/04/2025,Rent,Monthly rent
I,102.50,07/04/2025,Freelance,Client project`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Type:</span>
                  <code className="bg-muted px-1 rounded">I</code> (Income) or <code className="bg-muted px-1 rounded">E</code> (Expense)
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Date:</span>
                  Format: <code className="bg-muted px-1 rounded">dd/MM/yyyy</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Amount:</span>
                  Use dot (.) as decimal separator
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Results */}
        {importResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Import Results
              </CardTitle>
              <CardDescription>
                {importResult.success
                  ? "Transactions imported successfully"
                  : "Some issues occurred during import"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.importedCount}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{importResult.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Issues found:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={resetImport}>
                  Import Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
