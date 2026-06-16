/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  Package,
  ShoppingCart,
  Search,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMaterialUsageReport } from '@/service/Stages';

// Types
interface MaterialRequirement {
  name: string;
  required: number;
  stock: number;
  need: number;
}

interface ProformaReport {
  piNumber: string;
  customerName: string;
  materials: MaterialRequirement[];
}

interface MaterialRequirementDetail {
  piNumber: string;
  customerName: string;
  required: number;
}

interface MaterialSummary {
  materialName: string;
  requirements: MaterialRequirementDetail[];
  totalRequired: number;
  stock: number;
  need: number;
}

const MaterialUsageReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [piReports, setPiReports] = useState<ProformaReport[]>([]);
  const [summary, setSummary] = useState<MaterialSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMaterialUsageReport();
      
      if (result.success) {
        setPiReports(result.piReports);
        setSummary(result.summary);
        toast.success('Report loaded successfully');
      } else {
        toast.error('Failed to load report');
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error(error?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Filter data
  const getFilteredPIReports = () => {
    if (!searchTerm) return piReports;
    const term = searchTerm.toLowerCase();
    return piReports.filter(pi => 
      pi.piNumber.toLowerCase().includes(term) || 
      pi.customerName?.toLowerCase().includes(term) ||
      pi.materials.some(m => m.name.toLowerCase().includes(term))
    );
  };

  const getFilteredSummary = () => {
    if (!searchTerm) return summary;
    const term = searchTerm.toLowerCase();
    return summary.filter(m => 
      m.materialName.toLowerCase().includes(term)
    );
  };

  const getTotalNeed = () => {
    return summary.reduce((sum, m) => sum + m.need, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading material usage report...</p>
      </div>
    );
  }

  const filteredPIs = getFilteredPIReports();
  const filteredSummary = getFilteredSummary();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Material Usage Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Materials Required vs Stock Available
          </p>
        </div>
        {/* <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search PI, Customer, Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-62.5"
            />
          </div>
      
        </div> */}
      </div>
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSummary.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No materials summary available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSummary.map((material) => (
                <div key={material.materialName} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{material.materialName}</h3>
                      <Badge variant={material.need > 0 ? "destructive" : "outline"}>
                        Need: {material.need}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-1">
                      {material.requirements.map((req, idx) => (
                        <div key={idx} className="text-sm p-1">
                          {req.piNumber} ({req.customerName}) → {req.required}
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 mt-3 border-t">
                      <div className="flex justify-between text-sm p-1">
                        <span className="font-semibold">Total Required:</span>
                        <span>{material.totalRequired}</span>
                      </div>
                      <div className="flex justify-between text-sm p-1">
                        <span>Stock:</span>
                        <span>{material.stock}</span>
                      </div>
                      <div className="flex justify-between text-sm p-1 font-bold">
                        <span className={material.need > 0 ? 'text-red-600' : 'text-green-600'}>
                          Need:
                        </span>
                        <span className={material.need > 0 ? 'text-red-600' : 'text-green-600'}>
                          {material.need}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PI Section */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proforma Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPIs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No proforma invoices with pending materials</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPIs.map((pi) => (
                <div key={pi.piNumber} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b">
                    <h3 className="font-semibold text-lg">
                      {pi.piNumber}
                      {pi.customerName && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({pi.customerName})
                        </span>
                      )}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {pi.materials.length} material{pi.materials.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    {pi.materials.map((material, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 hover:bg-muted/30 rounded">
                        <span className="font-medium w-32">{material.name}</span>
                        <span>→ Required: {material.required}</span>
                        <span>| Stock: {material.stock}</span>
                        <span className={material.need > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          | Need: {material.need}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Summary Section */}
  

  
    </div>
  );
};

export default MaterialUsageReportPage;