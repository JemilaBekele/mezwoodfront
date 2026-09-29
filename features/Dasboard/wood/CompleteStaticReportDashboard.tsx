/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Filter, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { getCompleteStaticReport } from '@/service/dashboard';

// ==================== Types (only the fields this page uses) ====================

interface CreatorRow {
  creatorId: string | null;
  creatorName: string;
  totalRevenue?: number;
  totalSales?: number;
  totalValue?: number;
  totalPI?: number;
}

interface ItemRow {
  itemId: string;
  itemName: string;
  totalQuantity?: number;
  totalRevenue?: number;
  totalRequestedQuantity?: number;
  totalValue?: number;
}

interface CompleteStaticReportData {
  period: { startDate: string; endDate: string };
  itemSalesAnalysis: { allItems: ItemRow[] };
  salesByCreatorAnalysis: { allCreators: CreatorRow[] };
  proformaByCreatorAnalysis: { allPreparers: CreatorRow[] };
  proformaItemsAnalysis: { allItems: ItemRow[] };
  executiveSummary: {
    totalRevenueFromSales: number;
    totalProformaValue: number;
    topSalesPerson: { name: string; revenue: number; salesCount: number } | null;
    topPIPreparer: { name: string; value: number; piCount: number } | null;
  };
}

interface PersonRow {
  id: string;
  name: string;
  salesValue: number;
  salesCount: number;
  piValue: number;
  piCount: number;
}

interface ItemCombinedRow {
  id: string;
  name: string;
  soldQty: number;
  soldValue: number;
  piQty: number;
  piValue: number;
}

// ==================== Helpers ====================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num || 0);

// Local yyyy-mm-dd (toISOString would shift the day in UTC+3)
const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
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

const CompleteStaticReportDashboard: React.FC = () => {
  // Date inputs (editing) vs. the range the report was loaded with (applied)
  const [startDate, setStartDate] = useState(defaultRange().startDate);
  const [endDate, setEndDate] = useState(defaultRange().endDate);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const [reportData, setReportData] = useState<CompleteStaticReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Load only when the applied range changes (i.e. on button click)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCompleteStaticReport(appliedRange);
        if (!cancelled) setReportData(data);
      } catch (error: any) {
        console.error('Error fetching report data:', error);
        if (!cancelled) toast.error(error?.message || 'Failed to fetch report data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [appliedRange]);

  const applyFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }
    // New object so the same range can be reloaded too
    setAppliedRange({ startDate, endDate });
  };

  const resetFilter = () => {
    const range = defaultRange();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setAppliedRange(range);
  };

  // ── Per person: sales + PI ──────────────────────────────────
  const people = useMemo<PersonRow[]>(() => {
    if (!reportData) return [];
    const map = new Map<string, PersonRow>();
    const get = (c: CreatorRow) => {
      const key = c.creatorId || c.creatorName || 'unknown';
      if (!map.has(key)) {
        map.set(key, { id: key, name: c.creatorName || 'Unknown', salesValue: 0, salesCount: 0, piValue: 0, piCount: 0 });
      }
      return map.get(key)!;
    };
    (reportData.salesByCreatorAnalysis?.allCreators || []).forEach((c) => {
      const row = get(c);
      row.salesValue += Number(c.totalRevenue) || 0;
      row.salesCount += Number(c.totalSales) || 0;
    });
    (reportData.proformaByCreatorAnalysis?.allPreparers || []).forEach((c) => {
      const row = get(c);
      row.piValue += Number(c.totalValue) || 0;
      row.piCount += Number(c.totalPI) || 0;
    });
    return Array.from(map.values()).sort(
      (a, b) => b.salesValue + b.piValue - (a.salesValue + a.piValue)
    );
  }, [reportData]);

  // ── Per product: sold (stock) + requested (project / PI) ────
  const items = useMemo<ItemCombinedRow[]>(() => {
    if (!reportData) return [];
    const map = new Map<string, ItemCombinedRow>();
    const get = (i: ItemRow) => {
      if (!map.has(i.itemId)) {
        map.set(i.itemId, { id: i.itemId, name: i.itemName || 'Unknown', soldQty: 0, soldValue: 0, piQty: 0, piValue: 0 });
      }
      return map.get(i.itemId)!;
    };
    (reportData.itemSalesAnalysis?.allItems || []).forEach((i) => {
      const row = get(i);
      row.soldQty += Number(i.totalQuantity) || 0;
      row.soldValue += Number(i.totalRevenue) || 0;
    });
    (reportData.proformaItemsAnalysis?.allItems || []).forEach((i) => {
      const row = get(i);
      row.piQty += Number(i.totalRequestedQuantity) || 0;
      row.piValue += Number(i.totalValue) || 0;
    });
    return Array.from(map.values()).sort(
      (a, b) => b.soldValue + b.piValue - (a.soldValue + a.piValue)
    );
  }, [reportData]);

  const sum = <T,>(rows: T[], pick: (row: T) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  const totalSales = Number(reportData?.executiveSummary.totalRevenueFromSales) || 0;
  const totalPI = Number(reportData?.executiveSummary.totalProformaValue) || 0;
  const topSeller = reportData?.executiveSummary.topSalesPerson;
  const topPreparer = reportData?.executiveSummary.topPIPreparer;

  return (
    <div className="space-y-4">
      {/* Header + date filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Report</h1>
          <p className="text-sm text-muted-foreground">Sales and proforma invoices by person and item</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-xs">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-xs">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              className="w-40"
            />
          </div>
          <Button onClick={applyFilter} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
            Filter
          </Button>
          <Button variant="outline" onClick={resetFilter} disabled={loading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {appliedRange.startDate && appliedRange.endDate && (
        <p className="text-sm text-muted-foreground">
          Showing {appliedRange.startDate} to {appliedRange.endDate}
        </p>
      )}

      {!reportData && loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : reportData ? (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* Totals */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              title="Sales Value"
              value={formatCurrency(totalSales)}
              note={
                topSeller
                  ? `Top: ${topSeller.name} (${formatCurrency(topSeller.revenue)}, ${topSeller.salesCount} sales)`
                  : 'Paid sales only'
              }
            />
            <SummaryCard
              title="PI Value"
              value={formatCurrency(totalPI)}
              note={
                topPreparer
                  ? `Top: ${topPreparer.name} (${formatCurrency(topPreparer.value)}, ${topPreparer.piCount} PIs)`
                  : 'Cancelled PIs not counted'
              }
            />
            <SummaryCard title="Sales + PI Value" value={formatCurrency(totalSales + totalPI)} />
          </div>

          <Tabs defaultValue="people">
            <TabsList>
              <TabsTrigger value="people">By Person ({people.length})</TabsTrigger>
              <TabsTrigger value="items">By Product ({items.length})</TabsTrigger>
            </TabsList>

            {/* By person */}
            <TabsContent value="people">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead className="text-right">Sales Value</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">PI Value</TableHead>
                      <TableHead className="text-right">PIs</TableHead>
                      <TableHead className="text-right">Total Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No data for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      people.map((p, idx) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(p.salesValue)}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.salesCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(p.piValue)}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.piCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.salesCount + p.piCount}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(p.salesValue + p.piValue)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {people.length > 0 && (
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell />
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(sum(people, (p) => p.salesValue))}</TableCell>
                        <TableCell className="text-right tabular-nums">{sum(people, (p) => p.salesCount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(sum(people, (p) => p.piValue))}</TableCell>
                        <TableCell className="text-right tabular-nums">{sum(people, (p) => p.piCount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{sum(people, (p) => p.salesCount + p.piCount)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(sum(people, (p) => p.salesValue + p.piValue))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </TabsContent>

            {/* By product */}
            <TabsContent value="items">
              <div className="max-w-4xl overflow-x-auto rounded-md border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 w-8">#</TableHead>
                      <TableHead className="h-8">Product</TableHead>
                      <TableHead className="h-8 text-right">Stock Qty</TableHead>
                      <TableHead className="h-8 text-right">Stock Value</TableHead>
                      <TableHead className="h-8 text-right">Project Qty</TableHead>
                      <TableHead className="h-8 text-right">Project Value</TableHead>
                      <TableHead className="h-8 text-right">Total Qty</TableHead>
                      <TableHead className="h-8 text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No data for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-1.5 text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="max-w-56 truncate py-1.5 font-medium" title={item.name}>{item.name}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(item.soldQty)}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{formatCurrency(item.soldValue)}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(item.piQty)}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{formatCurrency(item.piValue)}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(item.soldQty + item.piQty)}</TableCell>
                          <TableCell className="py-1.5 text-right font-semibold tabular-nums">
                            {formatCurrency(item.soldValue + item.piValue)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {items.length > 0 && (
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell />
                        <TableCell>Total</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(sum(items, (i) => i.soldQty))}</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">{formatCurrency(sum(items, (i) => i.soldValue))}</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(sum(items, (i) => i.piQty))}</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">{formatCurrency(sum(items, (i) => i.piValue))}</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">{formatNumber(sum(items, (i) => i.soldQty + i.piQty))}</TableCell>
                        <TableCell className="py-1.5 text-right tabular-nums">
                          {formatCurrency(sum(items, (i) => i.soldValue + i.piValue))}
                        </TableCell>
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

export default CompleteStaticReportDashboard;
