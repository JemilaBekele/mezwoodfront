/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Filter, Loader2, Phone, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { utils, writeFile } from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';

import { getCustomer } from '@/service/customer';
import { getBanks } from '@/service/bank';
import {
  getPaymentsReport,
  IPaymentsReport,
  IPaymentsReportFilters,
} from '@/service/paymentsReport';

// ==================== Helpers ====================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Local yyyy-mm-dd (toISOString would shift the day in UTC+3)
const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const defaultFilters = (): Required<IPaymentsReportFilters> => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
    customerId: 'all',
    bankId: 'all',
    type: 'all',
  };
};

const SummaryCard = ({ title, value, note }: { title: string; value: string; note?: string }) => (
  <Card>
    <CardHeader className="pb-1">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </CardContent>
  </Card>
);

// ==================== Main Component ====================

const PaymentsReportDashboard: React.FC = () => {
  // Form values (editing) vs. filters the report was loaded with (applied on button click)
  const [form, setForm] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const [report, setReport] = useState<IPaymentsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone1?: string }[]>([]);
  const [banks, setBanks] = useState<{ id: string; bankName: string; accountNumber: string }[]>([]);

  // Dropdown data once
  useEffect(() => {
    Promise.all([getCustomer(), getBanks()])
      .then(([customerList, bankList]) => {
        setCustomers(
          [...(customerList || [])].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
        );
        setBanks(bankList || []);
      })
      .catch((error) => {
        console.error('Error loading filters:', error);
        toast.error('Failed to load customers and banks');
      });
  }, []);

  // Load report only when the applied filters change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPaymentsReport(applied);
        if (!cancelled) setReport(data);
      } catch (error: any) {
        console.error('Error fetching payments report:', error);
        if (!cancelled) toast.error(error?.message || 'Failed to fetch payments report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [applied]);

  const setField = <K extends keyof IPaymentsReportFilters>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyFilter = () => {
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      toast.error('Start date must be before end date');
      return;
    }
    setApplied({ ...form });
  };

  const resetFilter = () => {
    const filters = defaultFilters();
    setForm(filters);
    setApplied(filters);
  };

  const exportToExcel = () => {
    if (!report || report.payments.length === 0) {
      toast.warning('No payments to export');
      return;
    }
    const rows: Record<string, string | number>[] = report.payments.map((p) => ({
      Date: formatDate(p.date),
      Type: p.type === 'PROFORMA' ? 'PI' : 'Sale',
      'Invoice No': p.invoiceNo,
      Customer: p.customer?.name || '-',
      'Customer Phone': p.customer?.phone1 || '-',
      Bank: p.bank?.bankName || '-',
      'Account No': p.bank?.accountNumber || '-',
      'Paid By': p.paidBy || '-',
      'Received By': p.receivedBy || '-',
      Amount: p.amount,
      'Invoice Total': p.invoiceTotal,
      'Invoice Balance': p.invoiceBalance,
    }));
    rows.push({
      Date: 'TOTAL',
      Type: '',
      'Invoice No': '',
      Customer: '',
      'Customer Phone': '',
      Bank: '',
      'Account No': '',
      'Paid By': '',
      'Received By': '',
      Amount: report.summary.totalReceived,
      'Invoice Total': '',
      'Invoice Balance': '',
    });

    const bankRows = report.byBank.map((b) => ({
      Bank: b.bankName,
      'Account No': b.accountNumber || '-',
      Payments: b.count,
      'PI Payments': b.proformaAmount,
      'Sale Payments': b.saleAmount,
      Total: b.total,
    }));

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.json_to_sheet(rows), 'Payments');
    utils.book_append_sheet(workbook, utils.json_to_sheet(bankRows), 'By Bank');
    writeFile(workbook, `payments-report-${applied.startDate || 'all'}_${applied.endDate || 'all'}.xlsx`);
    toast.success(`Exported ${report.payments.length} payments`);
  };

  const appliedCustomer = customers.find((c) => c.id === applied.customerId)?.name;
  const appliedBank = banks.find((b) => b.id === applied.bankId)?.bankName;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Payments Report</h1>
          <p className="text-sm text-muted-foreground">Payments received on proforma invoices and sales</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} disabled={loading || !report?.payments.length}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filters - applied only with the Filter button */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">From</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">To</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Customer</Label>
              <Select value={form.customerId} onValueChange={(v) => setField('customerId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.phone1 ? ` · ${c.phone1}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bank</Label>
              <Select value={form.bankId} onValueChange={(v) => setField('bankId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All banks</SelectItem>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">PI & Sales</SelectItem>
                  <SelectItem value="proforma">PI payments</SelectItem>
                  <SelectItem value="sale">Sale payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilter} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                Filter
              </Button>
              <Button variant="outline" onClick={resetFilter} disabled={loading} aria-label="Reset filters">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applied filters */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {applied.startDate || 'start'} to {applied.endDate || 'today'}
        </span>
        {appliedCustomer && <Badge variant="secondary">Customer: {appliedCustomer}</Badge>}
        {appliedBank && <Badge variant="secondary">Bank: {appliedBank}</Badge>}
        {applied.type !== 'all' && (
          <Badge variant="secondary">{applied.type === 'proforma' ? 'PI payments' : 'Sale payments'}</Badge>
        )}
      </div>

      {!report && loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : report ? (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              title="Total Received"
              value={formatCurrency(report.summary.totalReceived)}
              note={`${report.summary.paymentCount} payments from ${report.summary.customerCount} customers`}
            />
            <SummaryCard
              title="PI Payments"
              value={formatCurrency(report.summary.proformaTotal)}
              note={`${report.summary.proformaCount} payments`}
            />
            <SummaryCard
              title="Sale Payments"
              value={formatCurrency(report.summary.saleTotal)}
              note={`${report.summary.saleCount} payments`}
            />
          </div>

          <Tabs defaultValue="payments">
            <TabsList>
              <TabsTrigger value="payments">Payments ({report.payments.length})</TabsTrigger>
              <TabsTrigger value="banks">By Bank ({report.byBank.length})</TabsTrigger>
            </TabsList>

            {/* Payments */}
            <TabsContent value="payments">
              <div className="overflow-x-auto rounded-md border">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Invoice Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          No payments for these filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.payments.map((p) => (
                        <TableRow key={`${p.type}-${p.id}`}>
                          <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                          <TableCell>
                            <Badge variant={p.type === 'PROFORMA' ? 'outline' : 'secondary'}>
                              {p.type === 'PROFORMA' ? 'PI' : 'Sale'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {p.documentId ? (
                              <Link
                                href={
                                  p.type === 'PROFORMA'
                                    ? `/dashboard/ProformaInvoice/view?id=${p.documentId}`
                                    : `/dashboard/Sell/view?id=${p.documentId}`
                                }
                                className="hover:underline"
                              >
                                {p.invoiceNo}
                              </Link>
                            ) : (
                              p.invoiceNo
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{p.customer?.name || '-'}</div>
                            {p.customer?.phone1 && (
                              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {p.customer.phone1}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{p.bank?.bankName || '-'}</div>
                            {p.bank?.accountNumber && (
                              <div className="text-xs text-muted-foreground">{p.bank.accountNumber}</div>
                            )}
                          </TableCell>
                          <TableCell>{p.paidBy || '-'}</TableCell>
                          <TableCell>{p.receivedBy || '-'}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(p.invoiceBalance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {report.payments.length > 0 && (
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell colSpan={7}>Total</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(report.summary.totalReceived)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </TabsContent>

            {/* By bank */}
            <TabsContent value="banks">
              <div className="max-w-4xl overflow-x-auto rounded-md border">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank</TableHead>
                      <TableHead className="text-right">Payments</TableHead>
                      <TableHead className="text-right">PI Payments</TableHead>
                      <TableHead className="text-right">Sale Payments</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byBank.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No payments for these filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.byBank.map((b) => (
                        <TableRow key={b.bankId || b.bankName}>
                          <TableCell>
                            <div className="font-medium">{b.bankName}</div>
                            {b.accountNumber && (
                              <div className="text-xs text-muted-foreground">{b.accountNumber}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{b.count}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(b.proformaAmount)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(b.saleAmount)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(b.total)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {report.summary.totalReceived
                              ? `${Math.round((b.total / report.summary.totalReceived) * 100)}%`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {report.byBank.length > 0 && (
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right tabular-nums">{report.summary.paymentCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(report.summary.proformaTotal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(report.summary.saleTotal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(report.summary.totalReceived)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">No report data</p>
      )}
    </div>
  );
};

export default PaymentsReportDashboard;
