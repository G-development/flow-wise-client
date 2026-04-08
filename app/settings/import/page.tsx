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
}

export default function Import() {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    incomeCount: number;
    expenseCount: number;
    totalProcessed: number;
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
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<csvRow>) => {
          const rows = results.data;
          const errors: string[] = [];

          // Validate headers
          const requiredHeaders = ['Type', 'Amount', 'Date', 'Category'];
          const headers = results.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
            toast.error('Invalid CSV format', { id: loadingToast });
            setImportResult({ success: false, incomeCount: 0, expenseCount: 0, totalProcessed: rows.length, errors });
            setIsLoading(false);
            return;
          }

          // Validate and filter data
          const valid = rows.filter((r, index) => {
            const rowNum = index + 2; // +2 because of 0-index and header row

            if (!["I", "E"].includes(r.Type?.trim())) {
              errors.push(`Row ${rowNum}: Invalid Type "${r.Type}". Must be "I" or "E"`);
              return false;
            }

            if (isNaN(parseFloat(r.Amount?.replace(',', '.')))) {
              errors.push(`Row ${rowNum}: Invalid Amount "${r.Amount}"`);
              return false;
            }

            try {
              parse(r.Date, "dd/MM/yyyy", new Date());
            } catch {
              errors.push(`Row ${rowNum}: Invalid Date "${r.Date}". Expected format: dd/MM/yyyy`);
              return false;
            }

            if (!r.Category?.trim()) {
              errors.push(`Row ${rowNum}: Missing Category`);
              return false;
            }

            return true;
          });

          if (valid.length === 0) {
            toast.error('No valid transactions found', { id: loadingToast });
            setImportResult({ success: false, incomeCount: 0, expenseCount: 0, totalProcessed: rows.length, errors });
            setIsLoading(false);
            return;
          }

          // Process valid data
          const income = valid
            .filter((r) => r.Type === "I")
            .map((r) => ({
              amount: parseFloat(r.Amount.replace(",", ".")),
              date: parse(r.Date, "dd/MM/yyyy", new Date()),
              category: r.Category.trim(),
            }));

          const expense = valid
            .filter((r) => r.Type === "E")
            .map((r) => ({
              amount: parseFloat(r.Amount.replace(",", ".")),
              date: new Date(r.Date),
              category: r.Category.trim(),
            }));

          toast.loading('Importing transactions...', { id: loadingToast });

          // Send to API
          const res = await apiFetch("/import", {
            method: "POST",
            body: JSON.stringify({ income, expense }),
          });

          if (res.ok) {
            toast.success(`Successfully imported ${income.length + expense.length} transactions!`, { id: loadingToast });
            setImportResult({
              success: true,
              incomeCount: income.length,
              expenseCount: expense.length,
              totalProcessed: rows.length,
              errors
            });
          } else {
            const errorData = await res.json().catch(() => ({ message: 'Import failed' }));
            toast.error(errorData.message || 'Import failed', { id: loadingToast });
            setImportResult({
              success: false,
              incomeCount: income.length,
              expenseCount: expense.length,
              totalProcessed: rows.length,
              errors: [...errors, errorData.message || 'Import failed']
            });
          }
        },
        error: (parseError) => {
          toast.error('Failed to parse CSV file', { id: loadingToast });
          setImportResult({
            success: false,
            incomeCount: 0,
            expenseCount: 0,
            totalProcessed: 0,
            errors: [`CSV parsing error: ${parseError.message}`]
          });
        }
      });
    } catch (catchError) {
      const message = catchError instanceof Error ? catchError.message : 'Unexpected error occurred';
      toast.error(`Unexpected error during import: ${message}`, { id: loadingToast });
      setImportResult({
        success: false,
        incomeCount: 0,
        expenseCount: 0,
        totalProcessed: 0,
        errors: [message]
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
                  <strong>Required columns:</strong> Type, Amount, Date, Category
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">Example CSV content:</p>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
{`Type,Amount,Date,Category
I,261.88,02/04/2025,Salary
E,721.68,04/04/2025,Rent
I,102.50,07/04/2025,Freelance`}
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
                  <div className="text-2xl font-bold text-green-600">{importResult.incomeCount}</div>
                  <div className="text-sm text-muted-foreground">Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.expenseCount}</div>
                  <div className="text-sm text-muted-foreground">Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.incomeCount + importResult.expenseCount}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{importResult.totalProcessed}</div>
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
