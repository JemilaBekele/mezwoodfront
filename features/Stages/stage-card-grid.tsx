/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ImageOff, Phone, X } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { normalizeImagePath } from '@/lib/norm';

// Same props as the DataTable components it replaces, so it is a drop-in swap.
// Extra props (currentPage, searchValue, filters...) are accepted and ignored, like newdatatable.
interface StageCardGridProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
  pageSizeOptions?: number[];
  meta?: Record<string, any>;
  [key: string]: any;
}

// All images of the project's PI items (falls back to direct items for sells)
function getItemImages(record: any): { url: string; label: string }[] {
  const list: { url: string; label: string }[] = [];
  const items: any[] = record?.invoice?.items || record?.items || [];
  items.forEach((piItem) => {
    const label = piItem?.itemname || piItem?.item?.name || piItem?.description || '';
    (piItem?.images || []).forEach((img: any) => {
      const url = normalizeImagePath(img?.imageUrl);
      if (url) list.push({ url, label });
    });
  });
  return list;
}

// ─── Card ───────────────────────────────────────────────────────
function StageCard<TData>({ row }: { row: Row<TData> }) {
  const record = row.original as any;
  const images = useMemo(() => getItemImages(record), [record]);
  const hasMultipleImages = images.length > 1;

  const [imageIndex, setImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  // Column cells: first one is the card title, 'actions' goes at the bottom, the rest are fields
  const cells = row.getVisibleCells();
  const actionCell = cells.find((c) => c.column.id === 'actions');
  const contentCells = cells.filter((c) => c.column.id !== 'actions');
  const [titleCell, ...fieldCells] = contentCells;
  const headerOf = (cell: (typeof cells)[number]) => {
    const header = cell.getContext().table.getFlatHeaders().find((h) => h.column.id === cell.column.id);
    return header ? flexRender(cell.column.columnDef.header, header.getContext()) : null;
  };
  const title = record?.invoice?.piNumber || record?.invoiceNo || '';
  const customer = record?.customer || record?.invoice?.customer;
  const customerPhone = [customer?.phone1, customer?.phone2].filter(Boolean).join(' / ');

  return (
    <>
      <div
        className="group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
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
                alt={images[imageIndex]?.label || title || 'Project image'}
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
                        index === imageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                  {images.length > 10 && (
                    <span className="text-[10px] font-medium leading-none text-white">
                      +{images.length - 10}
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

        {/* Details - the page's own column cells */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {titleCell && (
            <div className="text-base font-semibold">
              {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
            </div>
          )}

          {customerPhone && (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              {customerPhone}
            </p>
          )}

          {fieldCells.map((cell) => {
            const label = headerOf(cell);
            return (
              <div key={cell.id} className="min-w-0 border-t pt-2 text-sm">
                {label && (
                  <div className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</div>
                )}
                <div className="min-w-0 wrap-break-word">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            );
          })}

          {/* Actions - the page's own cell-action */}
          {actionCell && (
            <div className="mt-auto flex w-full justify-end border-t pt-2">
              {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
            </div>
          )}
        </div>
      </div>

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
                  alt={images[modalIndex]?.label || 'Project image'}
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
                {title && <h3 className="text-lg font-semibold">#{title}</h3>}
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

// ─── Grid ───────────────────────────────────────────────────────
export function StageCardGrid<TData, TValue>({
  columns,
  data,
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50],
  meta = {}
}: StageCardGridProps<TData, TValue>) {
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withOptions({ shallow: false }).withDefault(1)
  );
  const [pageSize, setPageSize] = useQueryState(
    'limit',
    parseAsInteger
      .withOptions({ shallow: false, history: 'push' })
      .withDefault(10)
  );

  const pageCount = Math.max(Math.ceil(totalItems / pageSize), 1);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    // Headers are used as plain field labels inside the cards
    enableSorting: false,
    enableHiding: false,
    meta
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {rows.length ? (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => (
            <StageCard key={row.id} row={row} />
          ))}
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No results.
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 py-2 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </>
          ) : (
            'No entries found'
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm font-medium">Per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-17.5">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm font-medium">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
