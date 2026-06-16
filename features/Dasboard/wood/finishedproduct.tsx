/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Package,
  Layers,
  
  Hammer,
  Box,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  TreePine,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getDetailedFinishedProductsReport } from '@/service/dashboard';

// ==================== Types ====================

interface MaterialUsage {
  plainMDF: number;
  laminatedMDF: number;
  wood: number;
  metal: number;
}

interface FinishedProduct {
  productId: string;
  productName: string;
  productDescription: string;
  size: string | null;
  productQuantity: number;
  projectId: string;
  finishedDate: Date | null;
  workLogDates: Date[];
  plainMDF: number;
  laminatedMDF: number;
  wood: number;
  metal: number;
  materialUsage: MaterialUsage;
}

interface FinishedProductsReportData {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalProjects: number;
    totalProducts: number;
    totalMaterialUsage: MaterialUsage;
  };
  products: FinishedProduct[];
  generatedAt: Date;
}

// ==================== Helper Components ====================

const MaterialBadge: React.FC<{ type: string; quantity: number }> = ({ type, quantity }) => {
  const getColor = () => {
    switch (type) {
      case 'plainMDF':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'laminatedMDF':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'wood':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'metal':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'plainMDF':
        return <Layers className="h-3 w-3" />;
      case 'laminatedMDF':
        return <Box className="h-3 w-3" />;
      case 'wood':
        return <TreePine  className="h-3 w-3" />;
      case 'metal':
        return <Hammer className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'plainMDF':
        return 'Plain MDF';
      case 'laminatedMDF':
        return 'Laminated MDF';
      case 'wood':
        return 'Wood';
      case 'metal':
        return 'Metal';
      default:
        return type;
    }
  };

  if (quantity === 0) return null;

  return (
    <Badge variant="outline" className={`${getColor()} font-medium gap-1`}>
      {getIcon()}
      {getLabel()}: {quantity}
    </Badge>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, description, icon, color = 'blue' }) => (
  <Card className={`border-l-4 border-l-${color}-500`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ==================== Main Component ====================

const FinishedProductsReportDashboard: React.FC = () => {
  // State
  const [tempStartDate, setTempStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState<FinishedProductsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('materials');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');

  const fetchReportData = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const data = await getDetailedFinishedProductsReport({
        startDate,
        endDate,
        materialTypes: ['plainMDF', 'laminatedMDF', 'wood', 'metal'],
      });
      console.log(data)
      setReportData(data);
      toast.success('Report data refreshed');
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error(error.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Only fetch on initial mount
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only runs once on mount

  const handleApplyDateRange = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    // Fetch will happen when startDate/endDate change via their useEffect
  };

  // Fetch when startDate or endDate changes (after Apply button click)
  useEffect(() => {
    // Skip the initial render since we already fetched in mount
    if (startDate && endDate) {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Filter products by material type
  const getFilteredProducts = () => {
    if (!reportData) return [];
    
    if (selectedMaterial === 'all') {
      return reportData.products;
    }
    
    return reportData.products.filter(product => 
      product.materialUsage[selectedMaterial as keyof MaterialUsage] > 0
    );
  };

  // Get products grouped by project
  const getProductsByProject = () => {
    if (!reportData) return new Map();
    
    const projectMap = new Map();
    
    reportData.products.forEach(product => {
      if (!projectMap.has(product.projectId)) {
        projectMap.set(product.projectId, {
          projectId: product.projectId,
          finishedDate: product.finishedDate,
          products: [],
          totalMaterials: {
            plainMDF: 0,
            laminatedMDF: 0,
            wood: 0,
            metal: 0,
          },
        });
      }
      
      const project = projectMap.get(product.projectId);
      project.products.push(product);
      project.totalMaterials.plainMDF += product.plainMDF;
      project.totalMaterials.laminatedMDF += product.laminatedMDF;
      project.totalMaterials.wood += product.wood;
      project.totalMaterials.metal += product.metal;
    });
    
    return projectMap;
  };

  const filteredProducts = getFilteredProducts();
  const projectsByMap = getProductsByProject();
  const projects = Array.from(projectsByMap.values());

  if (loading && !reportData) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Finished Products Report</h1>
          <p className="text-muted-foreground">
            Track finished products and material usage (Plain MDF, Laminated MDF, Wood, Metal)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchReportData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-40">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleApplyDateRange} className="h-10">
              Apply Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Material Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Material:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    className={`cursor-pointer ${selectedMaterial === 'all' ? 'bg-primary' : 'bg-muted hover:bg-muted/80'}`}
                    onClick={() => setSelectedMaterial('all')}
                  >
                    All ({reportData.products.length})
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${selectedMaterial === 'plainMDF' ? 'bg-amber-600' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                    onClick={() => setSelectedMaterial('plainMDF')}
                  >
                    Plain MDF ({reportData.products.filter(p => p.plainMDF > 0).length})
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${selectedMaterial === 'laminatedMDF' ? 'bg-emerald-600' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                    onClick={() => setSelectedMaterial('laminatedMDF')}
                  >
                    Laminated MDF ({reportData.products.filter(p => p.laminatedMDF > 0).length})
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${selectedMaterial === 'wood' ? 'bg-orange-600' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'}`}
                    onClick={() => setSelectedMaterial('wood')}
                  >
                    Wood ({reportData.products.filter(p => p.wood > 0).length})
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${selectedMaterial === 'metal' ? 'bg-slate-600' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                    onClick={() => setSelectedMaterial('metal')}
                  >
                    Metal ({reportData.products.filter(p => p.metal > 0).length})
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

       

          {/* Material Usage Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard
              title="Plain MDF Used"
              value={`${formatNumber(reportData.summary.totalMaterialUsage.plainMDF)} units`}
              description="Total plain MDF material"
              icon={<Layers className="h-4 w-4" />}
              color="amber"
            />
            <MetricCard
              title="Laminated MDF Used"
              value={`${formatNumber(reportData.summary.totalMaterialUsage.laminatedMDF)} units`}
              description="Total laminated MDF material"
              icon={<Box className="h-4 w-4" />}
              color="emerald"
            />
            <MetricCard
              title="Wood Used"
              value={`${formatNumber(reportData.summary.totalMaterialUsage.wood)} units`}
              description="Total wood material"
              icon={<TreePine  className="h-4 w-4" />}
              color="orange"
            />
            <MetricCard
              title="Metal Used"
              value={`${formatNumber(reportData.summary.totalMaterialUsage.metal)} units`}
              description="Total metal material"
              icon={<Hammer className="h-4 w-4" />}
              color="slate"
            />
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
               <TabsTrigger 
                value="materials"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                Material Analysis
              </TabsTrigger>
                    <TabsTrigger 
                value="by-project"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                By Project
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                Products List
              </TabsTrigger>
        
           
            </TabsList>

            {/* Products List Tab */}
            <TabsContent value="summary" className="space-y-6 mt-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-r  rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Finished Products
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {filteredProducts.length} products found in {reportData.summary.totalProjects} projects
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader >
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Finished Date</TableHead>
                          <TableHead colSpan={4}>Material Usage</TableHead>
                        </TableRow>
                        <TableRow className="bg-gray-50 border-t">
                          <TableHead colSpan={4}></TableHead>
                          <TableHead className="text-amber-600">Plain MDF</TableHead>
                          <TableHead className="text-emerald-600">Laminated MDF</TableHead>
                          <TableHead className="text-orange-600">Wood</TableHead>
                          <TableHead className="text-slate-600">Metal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.productId} >
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell>{product.size || 'N/A'}</TableCell>
                            <TableCell className="font-semibold">{formatNumber(product.productQuantity)}</TableCell>
                            <TableCell>{formatDate(product.finishedDate)}</TableCell>
                            <TableCell className="text-amber-600 font-semibold">{formatNumber(product.plainMDF)}</TableCell>
                            <TableCell className="text-emerald-600 font-semibold">{formatNumber(product.laminatedMDF)}</TableCell>
                            <TableCell className="text-orange-600 font-semibold">{formatNumber(product.wood)}</TableCell>
                            <TableCell className="text-slate-600 font-semibold">{formatNumber(product.metal)}</TableCell>
                          </TableRow>
                        ))}
                        {filteredProducts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No products found with the selected material filter
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* By Project Tab */}
            <TabsContent value="by-project" className="space-y-6 mt-6">
  {projects.map((project) => (
    <Card
      key={project.projectId}
      className="border border-border/50 bg-card shadow-lg dark:shadow-black/20"
    >
      <CardHeader className="bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-900/20 rounded-t-lg border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardDescription className="mt-1 text-muted-foreground">
              Finished: {formatDate(project.finishedDate)} |
              Products: {project.products.length}
            </CardDescription>
          </div>

          <div className="flex gap-2 flex-wrap">
            {project.totalMaterials.plainMDF > 0 && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Plain MDF: {project.totalMaterials.plainMDF}
              </Badge>
            )}

            {project.totalMaterials.laminatedMDF > 0 && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Lam MDF: {project.totalMaterials.laminatedMDF}
              </Badge>
            )}

            {project.totalMaterials.wood > 0 && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                Wood: {project.totalMaterials.wood}
              </Badge>
            )}

            {project.totalMaterials.metal > 0 && (
              <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Metal: {project.totalMaterials.metal}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="rounded-lg border border-border overflow-x-auto bg-background">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-border">
                <TableHead className="text-foreground">
                  Product Name
                </TableHead>

                <TableHead className="text-foreground">
                  Size
                </TableHead>

                <TableHead className="text-foreground">
                  Quantity
                </TableHead>

                <TableHead className="text-amber-600 dark:text-amber-400">
                  Plain MDF
                </TableHead>

                <TableHead className="text-emerald-600 dark:text-emerald-400">
                  Lam MDF
                </TableHead>

                <TableHead className="text-orange-600 dark:text-orange-400">
                  Wood
                </TableHead>

                <TableHead className="text-slate-600 dark:text-slate-400">
                  Metal
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {project.products.map((product: FinishedProduct) => (
                <TableRow
                  key={product.productId}
                  className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {product.productName}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {product.size || 'N/A'}
                  </TableCell>

                  <TableCell className="text-foreground">
                    {formatNumber(product.productQuantity)}
                  </TableCell>

                  <TableCell className="text-amber-600 dark:text-amber-400 font-medium">
                    {formatNumber(product.plainMDF)}
                  </TableCell>

                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatNumber(product.laminatedMDF)}
                  </TableCell>

                  <TableCell className="text-orange-600 dark:text-orange-400 font-medium">
                    {formatNumber(product.wood)}
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                    {formatNumber(product.metal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  ))}
</TabsContent>

            {/* Material Analysis Tab */}
            <TabsContent value="materials" className="space-y-6 mt-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-r rounded-t-lg border-b">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Layers className="h-6 w-6" />
                    Material Usage Analysis
                  </CardTitle>
                  <CardDescription>
                    Breakdown of material types used across all finished products
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader >
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Materials Used</TableHead>
                          <TableHead>Total Units</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.products.map((product) => {
                          const materials = [
                            { type: 'plainMDF', label: 'Plain MDF', qty: product.plainMDF },
                            { type: 'laminatedMDF', label: 'Laminated MDF', qty: product.laminatedMDF },
                            { type: 'wood', label: 'Wood', qty: product.wood },
                            { type: 'metal', label: 'Metal', qty: product.metal },
                          ].filter(m => m.qty > 0);
                          
                          const totalUnits = product.plainMDF + product.laminatedMDF + product.wood + product.metal;
                          
                          return (
                            <TableRow key={product.productId}>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                  {materials.map(m => (
                                    <MaterialBadge key={m.type} type={m.type} quantity={m.qty} />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">{formatNumber(totalUnits)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default FinishedProductsReportDashboard;