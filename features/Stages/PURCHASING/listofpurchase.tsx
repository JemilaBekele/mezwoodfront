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
  Eye,
  X,
  Image as ImageIcon,
  Info,
  Palette,
  Ruler,
  Tag,
  User,
  Calendar,
  Clock,
  FileCheck,
} from 'lucide-react';

import { getMaterialUsageReport } from '@/service/Stages';
import { normalizeImagePath } from '@/lib/norm';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types matching the backend response
interface MaterialRequirement {
  materialId: string;
  name: string;
  imageUrl?: string | null;
  required: number;
  stock: number;
  need: number;
  color?: string;
  size?: string;
  materialType?: string;
}

// Update the ProformaReport interface to include requestedDelivery
interface ProformaReport {
  piNumber: string;
  customerName: string;
  projectId?: string | null;
  projectStatus?: string | null;
  designerName?: string | null;
  designerEmail?: string | null;
  designFinished?: boolean;
  requestedDelivery?: string | null; // Add requested delivery per PI
  materials: MaterialRequirement[];
}

// Update MaterialRequirementDetail interface
interface MaterialRequirementDetail {
  piNumber: string;
  customerName: string;
  required: number;
  status?: string;
  designerName?: string | null;
  designFinished?: boolean;
  requestedDelivery?: string | null; // Add requested delivery per requirement
}

interface MaterialSummary {
  materialId: string;
  materialName: string;
  imageUrl?: string | null;
  requirements: MaterialRequirementDetail[];
  totalRequired: number;
  stock: number;
  need: number;
  color?: string;
  size?: string;
  materialType?: string;
}

interface ReportStats {
  requestDate: string;
  totalEligibleProjects: number;
  totalIneligibleProjects: number;
  totalProjectsWithoutDesign: number;
  totalMaterialsNeeded: number;
  totalPurchaseNeeded: number;
  totalMaterialsInSummary: number;
  projectsWithMaterials: number;
}

interface ReportResponse {
  success: boolean;
  requestDate?: string;
  piReports: ProformaReport[];
  summary: MaterialSummary[];
  stats?: ReportStats | null;
}

const MaterialUsageReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [piReports, setPiReports] = useState<ProformaReport[]>([]);
  const [summary, setSummary] = useState<MaterialSummary[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [globalRequestDate, setGlobalRequestDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedAt, setGeneratedAt] = useState<Date>(new Date());

  // State for image preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // State for material detail modal
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Function to handle image preview
  const handleImageClick = (imageUrl: string, name: string) => {
    setPreviewImage({ url: imageUrl, name });
    setIsPreviewOpen(true);
  };

  // Function to close image preview
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  // Function to open material detail
  const handleMaterialClick = (material: MaterialSummary) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Format date short
  const formatDateShort = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setGeneratedAt(new Date());
    try {
      const result = await getMaterialUsageReport() as ReportResponse;
      
      if (result.success) {
        setPiReports(result.piReports || []);
        setSummary(result.summary || []);
        setStats(result.stats || null);
        setGlobalRequestDate(result.requestDate || result.stats?.requestDate || null);
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
      pi.designerName?.toLowerCase().includes(term) ||
      pi.materials.some(m => m.name.toLowerCase().includes(term) ||
                           (m.color && m.color.toLowerCase().includes(term)) ||
                           (m.materialType && m.materialType.toLowerCase().includes(term)))
    );
  };

  const getFilteredSummary = () => {
    if (!searchTerm) return summary;
    const term = searchTerm.toLowerCase();
    return summary.filter(m => 
      m.materialName.toLowerCase().includes(term) ||
      (m.color && m.color.toLowerCase().includes(term)) ||
      (m.size && m.size.toLowerCase().includes(term)) ||
      (m.materialType && m.materialType.toLowerCase().includes(term))
    );
  };

  const getTotalNeed = () => {
    return summary.reduce((sum, m) => sum + m.need, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get material type badge color
  const getMaterialTypeColor = (type?: string) => {
    switch (type) {
      case 'Plain MDF': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'Laminated MDF': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Wood': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Metal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Accessory': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Other': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
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
  const totalNeed = getTotalNeed();

  // Get the request date from stats or use generated date
  const displayGlobalRequestDate = globalRequestDate || stats?.requestDate || generatedAt.toISOString();

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
          
          {/* Global Request Date and Info - Displayed Prominently */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
           
            
            {/* Generated At */}
            <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-bold text-green-700 dark:text-green-300">Report Generated:</span>
              <span className="font-semibold text-green-800 dark:text-green-200">{formatDate(generatedAt.toISOString())}</span>
            </div>

            {/* Eligible Projects Count */}
            {stats && (
              <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800">
                <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-purple-700 dark:text-purple-300">Eligible Projects:</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">{stats.totalEligibleProjects}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search PI, Customer, Designer, Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-62.5"
            />
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Eligible Projects</p>
              <p className="text-2xl font-bold">{stats.totalEligibleProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Materials Needed</p>
              <p className="text-2xl font-bold">{stats.totalMaterialsNeeded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Need to Purchase</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalPurchaseNeeded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Materials in Summary</p>
              <p className="text-2xl font-bold">{stats.totalMaterialsInSummary}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Section with Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Summary
            <Badge variant="secondary" className="ml-2">
              {filteredSummary.length} materials
            </Badge>
            {totalNeed > 0 && (
              <Badge variant="destructive" className="ml-2">
                Need to purchase: {totalNeed} units
              </Badge>
            )}
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
              {filteredSummary.map((material) => {
                const imageUrl = material.imageUrl ? normalizeImagePath(material.imageUrl) : null;
                
                return (
                  <div 
                    key={material.materialId} 
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleMaterialClick(material)}
                  >
                    <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Material Image */}
                          {imageUrl ? (
                            <div 
                              className="relative h-8 w-8 rounded overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(imageUrl, 'material');
                              }}
                            >
                              <Image
                                src={imageUrl}
                                alt={'material'}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        <div>
                          <h3 className="font-semibold">{material.materialName}</h3>
                          <div className="flex items-center gap-1 flex-wrap">
                            {material.materialType && (
                              <Badge className={`text-xs ${getMaterialTypeColor(material.materialType)}`}>
                                {material.materialType}
                              </Badge>
                            )}
                            {material.color && (
                              <Badge variant="outline" className="text-xs">
                                {material.color}
                              </Badge>
                            )}
                            {material.size && (
                              <Badge variant="outline" className="text-xs">
                                {material.size}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground ml-1">
                              Used in {material.requirements.length} PI(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={material.need > 0 ? "destructive" : "outline"}>
                          Need: {material.need}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaterialClick(material);
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Required:</span>
                          <span className="font-semibold ml-2">{material.totalRequired}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock Available:</span>
                          <span className="font-semibold ml-2">{material.stock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Need to Purchase:</span>
                          <span className={`font-semibold ml-2 ${material.need > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {material.need}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {material.requirements.slice(0, 3).map((req, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {req.piNumber}: {req.required}
                          </Badge>
                        ))}
                        {material.requirements.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{material.requirements.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PI Section - Each PI has its own Request Date and Designer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proforma Invoices
            <Badge variant="secondary" className="ml-2">
              {filteredPIs.length} invoices
            </Badge>
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
                    {/* PI Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {pi.piNumber}
                      </h3>
                      {pi.customerName && (
                        <span className="text-sm text-muted-foreground">
                          ({pi.customerName})
                        </span>
                      )}
                      {pi.projectStatus && (
                        <Badge variant="outline" className="ml-1">
                          {pi.projectStatus}
                        </Badge>
                      )}
                      <Badge variant="outline" className="ml-1">
                        {pi.materials.length} material{pi.materials.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {/* PI Details - Request Date and Designer Name per PI */}
          {/* PI Details - Requested Delivery Date and Designer Name per PI */}
<div className="mt-3 flex flex-wrap items-center gap-3">
  {/* Requested Delivery Date per PI */}
  <div className="flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
    <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
    <span className="text-muted-foreground">Requested Delivery:</span>
    <span className="font-bold text-blue-700 dark:text-blue-300">
      {pi.requestedDelivery ? formatDate(pi.requestedDelivery) : 'Not Set'}
    </span>
  </div>
  
  {/* Designer Name per PI */}
  <div className="flex items-center gap-1.5 text-sm bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800">
    <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
    <span className="text-muted-foreground">Designer:</span>
    <span className="font-bold text-purple-700 dark:text-purple-300">
      {pi.designerName || 'Not Assigned'}
    </span>
  </div>

</div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    {pi.materials.map((material, idx) => {
                      const imageUrl = material.imageUrl ? normalizeImagePath(material.imageUrl) : null;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3 text-sm p-2 hover:bg-muted/30 rounded flex-wrap">
                          {/* Material Image */}
                          {imageUrl ? (
                            <div 
                              className="relative h-8 w-8 rounded overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(imageUrl, material.name);
                              }}
                            >
                              <Image
                                src={imageUrl}
                                alt={material.name}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium min-w-32">{material.name}</span>
                          
                          {/* Material Details */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {material.materialType && (
                              <Badge className={`text-xs ${getMaterialTypeColor(material.materialType)}`}>
                                {material.materialType}
                              </Badge>
                            )}
                            {material.color && (
                              <Badge variant="outline" className="text-xs">
                                {material.color}
                              </Badge>
                            )}
                            {material.size && (
                              <Badge variant="outline" className="text-xs">
                                {material.size}
                              </Badge>
                            )}
                          </div>
                          
                          <span className="ml-auto">→ Required: {material.required}</span>
                          <span>| Stock: {material.stock}</span>
                          <span className={material.need > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            | Need: {material.need}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-2xl">
          <DialogHeader className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-black/90 rounded-lg">
            {previewImage && (
              <>
                <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                </div>
                <div className="mt-4 text-center text-white">
                  <p className="text-sm font-medium">{previewImage.name}</p>
                  <p className="text-xs text-gray-400">Click outside or press ESC to close</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedMaterial?.imageUrl ? (
                <div 
                  className="relative h-12 w-12 rounded overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (selectedMaterial?.imageUrl) {
                      const url = normalizeImagePath(selectedMaterial.imageUrl);
                      if (url) handleImageClick(url, selectedMaterial.materialName);
                    }
                  }}
                >
                  <Image
                    src={normalizeImagePath(selectedMaterial.imageUrl)!}
                    alt={selectedMaterial?.materialName || 'Material'}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <span>{selectedMaterial?.materialName}</span>
                {selectedMaterial?.materialType && (
                  <Badge className={`ml-2 text-xs ${getMaterialTypeColor(selectedMaterial.materialType)}`}>
                    {selectedMaterial.materialType}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="space-y-6">
              {/* Material Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Required</p>
                  <p className="text-xl font-bold">{selectedMaterial.totalRequired}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Available</p>
                  <p className="text-xl font-bold">{selectedMaterial.stock}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Need to Purchase</p>
                  <p className={`text-2xl font-bold ${selectedMaterial.need > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedMaterial.need}
                  </p>
                </div>
              </div>

              {/* Material Properties */}
              {(selectedMaterial.color || selectedMaterial.size || selectedMaterial.materialType) && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Material Properties</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedMaterial.materialType && (
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge className={getMaterialTypeColor(selectedMaterial.materialType)}>
                          {selectedMaterial.materialType}
                        </Badge>
                      </div>
                    )}
                    {selectedMaterial.color && (
                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: selectedMaterial.color.toLowerCase() }}
                          />
                          <span className="font-medium">{selectedMaterial.color}</span>
                        </div>
                      </div>
                    )}
                    {selectedMaterial.size && (
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <span className="font-medium">{selectedMaterial.size}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PI Requirements */}
              <div>
                <h4 className="font-semibold mb-3">Required by Proforma Invoices</h4>
                <div className="space-y-2">
                  {selectedMaterial.requirements.map((req, idx) => (
                    <div key={idx} className="flex flex-col p-2 border-b last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{req.piNumber}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({req.customerName})
                          </span>
                          {req.status && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {req.status}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">
                          {req.required} units
                        </Badge>
                      </div>
                      {/* Designer Name and Request Date for each requirement */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {req.designerName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-md self-start border border-purple-200 dark:border-purple-800">
                            <User className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            <span>Designer:</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">{req.designerName}</span>
                          </div>
                        )}
                        {req.designFinished !== undefined && (
                          <Badge variant={req.designFinished ? "default" : "outline"} className="text-xs">
                            {req.designFinished ? '✅' : '❌'}
                          </Badge>
                        )}
                        {/* Request Date per requirement */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md self-start border border-blue-200 dark:border-blue-800">
                          <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span>Request:</span>
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            {formatDate(displayGlobalRequestDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Required across all PIs</span>
                  <span className="font-semibold">{selectedMaterial.totalRequired} units</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialUsageReportPage;