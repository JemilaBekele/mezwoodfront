"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Ban,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  Layers,
  X,
  FileCheck,
  Send,
  RefreshCw,
  ThumbsUp,
  CheckCircle,
  FileX,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hash,
  ImageOff,
  Pencil,
  Trash2,
  Wallet,
  Banknote,
  Building,
  Smartphone,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import {
  deleteProformaInvoice,
  listProformaInvoices,
  ProformaInvoiceListResponse,
} from "@/service/ProformaInvoice";
import { useTableQueryParams } from "@/hooks/use-table-query-params";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/modal/alert-modal";
import { PermissionGuard } from "@/components/PermissionGuard";
import { PERMISSIONS } from "@/stores/permissions";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeImagePath } from "@/lib/norm";
import { IProformaInvoice, IProformaInvoiceBank, PIStatus } from "@/models/ProformaInvoice";
import { RecordPaymentModal } from "./record-payment-modal";

type ProformaInvoiceListingPageProps = {
  // My PI page: only invoices prepared by the current user
  mine?: boolean;
};

// ─── Compact Status Pill ────────────────────────────────────────
function StatusPill({
  label,
  count,
  icon: Icon,
  selected,
  href,
  color,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "text-muted-foreground",
    amber: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    violet: "text-violet-600 dark:text-violet-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    teal: "text-teal-600 dark:text-teal-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
  };

  return (
    <Link href={href} aria-label={`Filter: ${label}`}>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-150 hover:bg-muted/50 ${
          selected
            ? "border-primary/30 bg-primary/5 shadow-sm"
            : "border-transparent bg-muted/30"
        }`}
      >
        <Icon className={`h-3.5 w-3.5 ${colorMap[color]}`} />
        <span className="font-semibold tabular-nums">{count}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
        {selected && <Check className="h-3 w-3 text-primary ml-auto" />}
      </div>
    </Link>
  );
}

// ─── Status Row Header ──────────────────────────────────────────
function StatusRowHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
    </div>
  );
}

// ─── PI Card (image list) ───────────────────────────────────────
const statusBadgeMap: Record<string, { label: string; cls: string }> = {
  PENDING_ST: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  APPROVED_ST: { label: "Approved", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SENT_TO_CLIENT: { label: "Sent", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  REVISION: { label: "Revision", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  APPROVED_CLIENT: { label: "Client OK", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  APPROVED_CREATE_PROJECT: { label: "Project", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

const paymentBadgeMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  PARTIAL: { label: "Partial", cls: "bg-orange-100/60 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
  PAID: { label: "Paid", cls: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  NONE: { label: "Stock", cls: "bg-muted text-muted-foreground" },
};

const formatMoney = (value?: number | string | null) => {
  const n = Number(value ?? 0);
  return (isNaN(n) ? 0 : n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Get icon for payment method
const getPaymentIcon = (method: string) => {
  const methodLower = method?.toLowerCase() || "";
  const iconMap: Record<string, React.ReactNode> = {
    cash: <Wallet className="h-3 w-3" />,
    bank: <Building className="h-3 w-3" />,
    card: <CreditCard className="h-3 w-3" />,
    mobile: <Smartphone className="h-3 w-3" />,
    cheque: <FileCheck className="h-3 w-3" />,
    credit: <CreditCard className="h-3 w-3" />,
    transfer: <Building className="h-3 w-3" />,
  };
  for (const [key, icon] of Object.entries(iconMap)) {
    if (methodLower.includes(key)) return icon;
  }
  return <User className="h-3 w-3" />;
};

// Unique paidBy methods (with summed amounts) from the PI banks
const getPaidByMethods = (banks?: IProformaInvoiceBank[]) => {
  const map = new Map<string, { method: string; amount: number }>();
  (banks || []).forEach((bank) => {
    if (!bank.paidBy) return;
    const key = bank.paidBy.toLowerCase();
    const existing = map.get(key);
    map.set(key, { method: bank.paidBy, amount: (existing?.amount || 0) + (bank.amount || 0) });
  });
  return Array.from(map.values());
};

export function ProformaInvoiceCard({
  invoice,
  onDeleted,
  onUpdated,
}: {
  invoice: IProformaInvoice;
  onDeleted: (id: string) => void;
  onUpdated?: (invoice: IProformaInvoice) => void;
}) {
  const router = useRouter();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const onConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteProformaInvoice(invoice.id);
      setOpenDeleteModal(false);
      toast.success("Proforma Invoice deleted successfully");
      onDeleted(invoice.id);
    } catch {
      toast.error("Error deleting Proforma Invoice. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // All PI item images (IProformaInvoiceItemImage), captioned with the item description.
  // The paginated list sends them ready-made in `invoice.images`.
  const images = useMemo(() => {
    if (invoice.images) {
      return invoice.images
        .map((img) => ({ url: normalizeImagePath(img.url), label: img.label }))
        .filter((img): img is { url: string; label: string } => Boolean(img.url));
    }
    const list: { url: string; label: string }[] = [];
    (invoice.items || []).forEach((piItem) => {
      const label = piItem.itemname || piItem.item?.name || piItem.description || "";
      (piItem.images || []).forEach((img) => {
        const url = normalizeImagePath(img.imageUrl);
        if (url) list.push({ url, label });
      });
    });
    return list;
  }, [invoice.images, invoice.items]);

  const hasMultipleImages = images.length > 1;
  const imageCount = invoice.imageCount ?? images.length;

  useEffect(() => {
    if (!isHovering || !hasMultipleImages) return;
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovering, hasMultipleImages, images.length]);

  const step = (setter: React.Dispatch<React.SetStateAction<number>>, dir: 1 | -1) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setter((prev) => (prev + dir + images.length) % images.length);
    };

  // Swipe left/right on touch screens to scroll through images
  const swipeHandlers = (setter: React.Dispatch<React.SetStateAction<number>>) => ({
    onTouchStart: (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchStartX === null || !hasMultipleImages) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        setter((prev) => (prev + (diff < 0 ? 1 : -1) + images.length) % images.length);
      }
      setTouchStartX(null);
    },
  });

  const paidBy = getPaidByMethods(invoice.banks);
  const customerName = invoice.customer?.name;
  const customerPhone = [invoice.customer?.phone1, invoice.customer?.phone2].filter(Boolean).join(" / ");
  const editUrl =
    invoice.status === PIStatus.APPROVED_CREATE_PROJECT
      ? `/dashboard/ProformaInvoice/second/${invoice.id}`
      : `/dashboard/ProformaInvoice/${invoice.id}`;

  const status = statusBadgeMap[invoice.status] || {
    label: String(invoice.status || "-").replace(/_/g, " "),
    cls: "bg-muted text-muted-foreground",
  };
  const payment = paymentBadgeMap[invoice.paymentStatus] || {
    label: invoice.paymentStatus || "-",
    cls: "bg-muted text-muted-foreground",
  };
  const items = invoice.items || [];
  const itemsCount = invoice.itemsCount ?? items.length;
  const balance = Number(invoice.balance ?? 0);
  const viewUrl = `/dashboard/ProformaInvoice/view?id=${invoice.id}`;
  const canView = hasPermission(PERMISSIONS.PROFORMA_INVOICE.VIEW.name);

  return (
    <>
      <div
        className="group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AlertModal
          isOpen={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          onConfirm={onConfirmDelete}
          loading={deleting}
        />

        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
          {images.length > 0 ? (
            <div
              className="relative h-full w-full cursor-pointer"
              onClick={() => {
                setModalIndex(imageIndex);
                setIsModalOpen(true);
              }}
              {...swipeHandlers(setImageIndex)}
            >
              <Image
                src={images[imageIndex]?.url}
                alt={images[imageIndex]?.label || invoice.piNumber}
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Image count badge */}
              {hasMultipleImages && (
                <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                  {imageIndex + 1} / {images.length}
                </div>
              )}

              {/* Dot indicators - one per image, click to jump */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 flex max-w-[90%] -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  {images.slice(0, 10).map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(index);
                      }}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        index === imageIndex ? "w-3 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                  {imageCount > 10 && (
                    <span className="text-[10px] font-medium leading-none text-white">
                      +{imageCount - 10}
                    </span>
                  )}
                </div>
              )}

              {hasMultipleImages && isHovering && (
                <>
                  <button
                    onClick={step(setImageIndex, -1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={step(setImageIndex, 1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/50">
              <ImageOff className="h-8 w-8" />
              <span className="mt-1 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            {canView ? (
              <Link
                href={viewUrl}
                className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline underline-offset-4"
              >
                <Hash className="h-3.5 w-3.5 opacity-40" />
                {invoice.piNumber ?? "-"}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-base font-semibold">
                <Hash className="h-3.5 w-3.5 opacity-40" />
                {invoice.piNumber ?? "-"}
              </span>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              {invoice.createdAt
                ? new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "-"}
            </span>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold uppercase text-muted-foreground">
              {customerName ? customerName.charAt(0) : "?"}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-medium">{customerName || "-"}</p>
              {customerPhone && (
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {customerPhone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>
              {status.label}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${payment.cls}`}>
              {payment.label}
            </span>
          </div>

          {/* Paid By */}
          {paidBy.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Paid by:</span>
              {paidBy.slice(0, 3).map((p) => (
                <span key={p.method} className="inline-flex items-center gap-0.5">
                  <span className="text-muted-foreground">{getPaymentIcon(p.method)}</span>
                  <span className="max-w-17.5 truncate font-medium">
                    {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                  </span>
                </span>
              ))}
              {paidBy.length > 3 && (
                <span className="font-medium text-muted-foreground">+{paidBy.length - 3}</span>
              )}
            </div>
          )}

          {/* Item descriptions */}
          {items.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              {items.slice(0, 3).map((piItem) => (
                <div key={piItem.id} className="flex justify-between gap-2 text-xs">
                  <span className="line-clamp-1 text-muted-foreground">
                    {piItem.itemname || piItem.item?.name || piItem.description || "-"}
                  </span>
                  <span className="shrink-0 tabular-nums">x{piItem.quantity}</span>
                </div>
              ))}
              {itemsCount > 3 && (
                <p className="text-xs text-muted-foreground">+{itemsCount - 3} more items</p>
              )}
            </div>
          )}

          {/* Amounts */}
          <div className="mt-auto grid grid-cols-3 gap-1 border-t pt-2 text-xs">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold tabular-nums">{formatMoney(invoice.total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(invoice.amountPaid)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p
                className={`font-medium tabular-nums ${
                  balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatMoney(invoice.balance)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2 pt-1">
            <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.VIEW.name} fallback="hide">
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted/70"
                onClick={() => router.push(viewUrl)}
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
            </PermissionGuard>

            <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.UPDATE.name} fallback="hide">
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                onClick={() => router.push(editUrl)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </PermissionGuard>

            {!invoice.store && balance > 0 && (
              <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.ADD_PAYMENT.name} fallback="hide">
                <button
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <Banknote className="h-3.5 w-3.5" /> Pay
                </button>
              </PermissionGuard>
            )}

            <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.DELETE.name} fallback="hide">
              <button
                className="flex items-center justify-center rounded-lg bg-red-100 px-2 py-1.5 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                onClick={() => setOpenDeleteModal(true)}
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {paymentDialogOpen && (
        <RecordPaymentModal
          invoice={invoice}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onPaid={onUpdated}
        />
      )}

      {/* Image modal */}
      {isModalOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm dark:bg-black/90"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative mx-4 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white transition-colors hover:text-gray-300"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="overflow-hidden rounded-lg bg-background">
              <div className="relative aspect-video w-full bg-black" {...swipeHandlers(setModalIndex)}>
                <Image
                  src={images[modalIndex]?.url}
                  alt={images[modalIndex]?.label || invoice.piNumber}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={step(setModalIndex, -1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={step(setModalIndex, 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                  {modalIndex + 1} / {images.length}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">#{invoice.piNumber}</h3>
                {images[modalIndex]?.label && (
                  <p className="mt-1 text-sm text-muted-foreground">{images[modalIndex].label}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Listing ───────────────────────────────────────────────
// Filters live in the URL. The API does the filtering, counting and paging;
// this component only shows one page and the counts it gets back.
export default function ProformaInvoiceListingPage({ mine = false }: ProformaInvoiceListingPageProps) {
  const { page, search, startDate, endDate } = useTableQueryParams();
  const searchParams = useSearchParams();
  // Always show 20 PIs per page (ignores ?limit=10 left in the URL by other tables/filters)
  const limit = 20;
  const paymentStatusFilter = searchParams.get("paymentStatus") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const searchTerm = search.trim();
  const [result, setResult] = useState<ProformaInvoiceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const lastSearchRef = useRef(searchTerm);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // While typing in the search box, wait until the user pauses
    const delay = searchTerm !== lastSearchRef.current ? 400 : 0;

    const timer = setTimeout(async () => {
      lastSearchRef.current = searchTerm;
      try {
        setLoading(true);
        setError(null);

        const res = await listProformaInvoices(
          {
            page,
            limit,
            search: searchTerm || undefined,
            from: startDate,
            to: endDate,
            paymentStatus: paymentStatusFilter,
            status: statusFilter,
          },
          mine
        );

        if (!cancelled) setResult(res);
      } catch {
        if (!cancelled) {
          setError("Error loading proforma invoices. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [endDate, limit, mine, page, paymentStatusFilter, reloadKey, searchTerm, startDate, statusFilter]);

  // ── Helpers ──────────────────────────────────────────────────
  const getPaymentStatusDisplayText = useCallback((status: string): string => {
    const map: Record<string, string> = {
      PENDING: "Pending", PARTIAL: "Partial", PAID: "Paid",
      CANCELLED: "Cancelled", NONE: "Stock",
    };
    return map[status] || "Unknown";
  }, []);

  const getStatusDisplayText = useCallback((status: string): string => {
    const map: Record<string, string> = {
      PENDING_ST: "Pending",
      APPROVED_ST: "Approved (ST)",
      SENT_TO_CLIENT: "Sent to Client",
      REVISION: "Revision",
      APPROVED_CLIENT: "Approved (Client)",
      APPROVED_CREATE_PROJECT: "Approved (Project)",
      CANCELLED: "Cancelled",
    };
    return map[status] || status || "Unknown";
  }, []);

  const buildQueryStringLocal = useCallback(
    (params: { paymentStatus?: string; status?: string; page?: string }) => {
      const urlParams = new URLSearchParams();
      if (search) urlParams.set("q", search);
      urlParams.set("page", params.page || "1");
      urlParams.set("limit", limit.toString());
      if (startDate) urlParams.set("startDate", startDate);
      if (endDate) urlParams.set("endDate", endDate);
      urlParams.set("paymentStatus", params.paymentStatus || paymentStatusFilter);
      urlParams.set("status", params.status || statusFilter);
      return `?${urlParams.toString()}`;
    },
    [search, limit, startDate, endDate, paymentStatusFilter, statusFilter]
  );

  const buildPaymentStatusFilterUrl = useCallback(
    (paymentStatus: string) => buildQueryStringLocal({ paymentStatus, page: "1" }),
    [buildQueryStringLocal]
  );

  const buildStatusFilterUrl = useCallback(
    (status: string) => buildQueryStringLocal({ status, page: "1" }),
    [buildQueryStringLocal]
  );

  const errorBox = error && (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
      <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Retry
      </Button>
    </div>
  );

  // ── First load & Error ───────────────────────────────────────
  if (!result) {
    return errorBox || <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  // ── Data (filtered, counted and paginated by the API) ────────
  const { data: invoices, total, totalPages, counts } = result;
  const hasFilter = paymentStatusFilter !== "all" || statusFilter !== "all";
  const hasAnyFilter = hasFilter || Boolean(searchTerm || startDate || endDate);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Payment Status Row ────────────────────────────── */}
      <div className="space-y-2">
        <StatusRowHeader title="Payment Status" icon={CircleDollarSign} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            label="All"
            count={counts.payment.all}
            icon={Layers}
            color="slate"
            selected={paymentStatusFilter === "all"}
            href={buildPaymentStatusFilterUrl("all")}
          />
          <StatusPill
            label="Pending"
            count={counts.payment.pending}
            icon={Clock}
            color="amber"
            selected={paymentStatusFilter === "PENDING"}
            href={buildPaymentStatusFilterUrl("PENDING")}
          />
          <StatusPill
            label="Partial"
            count={counts.payment.partial}
            icon={CreditCard}
            color="orange"
            selected={paymentStatusFilter === "PARTIAL"}
            href={buildPaymentStatusFilterUrl("PARTIAL")}
          />
          <StatusPill
            label="Paid"
            count={counts.payment.paid}
            icon={CircleDollarSign}
            color="emerald"
            selected={paymentStatusFilter === "PAID"}
            href={buildPaymentStatusFilterUrl("PAID")}
          />
          <StatusPill
            label="Cancelled"
            count={counts.payment.cancelled}
            icon={Ban}
            color="red"
            selected={paymentStatusFilter === "CANCELLED"}
            href={buildPaymentStatusFilterUrl("CANCELLED")}
          />
          <StatusPill
            label="Stock"
            count={counts.payment.none}
            icon={AlertCircle}
            color="violet"
            selected={paymentStatusFilter === "NONE"}
            href={buildPaymentStatusFilterUrl("NONE")}
          />
        </div>
      </div>

      {/* ── Document Status Row ────────────────────────────── */}
      <div className="space-y-2">
        <StatusRowHeader title="Document Status" icon={FileCheck} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            label="All"
            count={counts.document.all}
            icon={Layers}
            color="slate"
            selected={statusFilter === "all"}
            href={buildStatusFilterUrl("all")}
          />
          <StatusPill
            label="Pending"
            count={counts.document.pending}
            icon={Loader2}
            color="amber"
            selected={statusFilter === "PENDING_ST"}
            href={buildStatusFilterUrl("PENDING_ST")}
          />
          <StatusPill
            label="Approved ST"
            count={counts.document.approvedSt}
            icon={Check}
            color="blue"
            selected={statusFilter === "APPROVED_ST"}
            href={buildStatusFilterUrl("APPROVED_ST")}
          />
          <StatusPill
            label="Sent to Client"
            count={counts.document.sentToClient}
            icon={Send}
            color="purple"
            selected={statusFilter === "SENT_TO_CLIENT"}
            href={buildStatusFilterUrl("SENT_TO_CLIENT")}
          />
          <StatusPill
            label="Revision"
            count={counts.document.revision}
            icon={RefreshCw}
            color="orange"
            selected={statusFilter === "REVISION"}
            href={buildStatusFilterUrl("REVISION")}
          />
          <StatusPill
            label="Approved Client"
            count={counts.document.approvedClient}
            icon={ThumbsUp}
            color="teal"
            selected={statusFilter === "APPROVED_CLIENT"}
            href={buildStatusFilterUrl("APPROVED_CLIENT")}
          />
          <StatusPill
            label="Approved Project"
            count={counts.document.approvedProject}
            icon={CheckCircle}
            color="emerald"
            selected={statusFilter === "APPROVED_CREATE_PROJECT"}
            href={buildStatusFilterUrl("APPROVED_CREATE_PROJECT")}
          />
          <StatusPill
            label="Cancelled"
            count={counts.document.cancelled}
            icon={FileX}
            color="red"
            selected={statusFilter === "CANCELLED"}
            href={buildStatusFilterUrl("CANCELLED")}
          />
        </div>
      </div>

      {/* ── Active Filters & Clear ──────────────────────────── */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {paymentStatusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Payment: {getPaymentStatusDisplayText(paymentStatusFilter)}
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Status: {getStatusDisplayText(statusFilter)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              ({total} results)
            </span>
          </div>
          <Link
            href={buildQueryStringLocal({ paymentStatus: "all", status: "all", page: "1" })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Link>
        </div>
      )}

      {/* ── Image List ────────────────────────────────────── */}
      {errorBox ? (
        errorBox
      ) : total === 0 && !hasAnyFilter ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No invoices yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;New Invoice&quot; to get started.
          </p>
        </div>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Showing {total > 0 ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, total)} of {total} invoices
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Loading" />}
          </p>

          <div
            className={`grid w-full grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
              loading ? "pointer-events-none opacity-50" : ""
            }`}
            aria-busy={loading}
          >
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <ProformaInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  // Deleting or paying changes totals and counts: reload this page from the API
                  onDeleted={reload}
                  onUpdated={reload}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No invoices found matching your criteria.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {page > 1 ? (
                <Button variant="outline" asChild>
                  <Link href={buildQueryStringLocal({ page: String(page - 1) })}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Previous</Button>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5 || page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} asChild>
                    <Link href={buildQueryStringLocal({ page: String(pageNum) })}>{pageNum}</Link>
                  </Button>
                );
              })}
              {page < totalPages ? (
                <Button variant="outline" asChild>
                  <Link href={buildQueryStringLocal({ page: String(page + 1) })}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Next</Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}