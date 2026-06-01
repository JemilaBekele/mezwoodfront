/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import {
  CalendarDays,
  Package,
  Store,
  ShoppingCart,
  Layers,
  Ruler,
} from 'lucide-react';
import {
  IProduct,
  IStockSummary,
  IDimensionStockInfo,
} from '@/models/Product';
import { ProductCellAction } from './cell-action';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DimensionBadge = ({
  height,
  width,
  quantity,
}: {
  height: number;
  width: number;
  quantity: number;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant='outline'
          className='
            border-blue-200
            bg-blue-50
            text-xs
            text-blue-700
            dark:border-blue-900/40
            dark:bg-blue-950/20
            dark:text-blue-300
          '
        >
          {height}×{width} ({quantity})
        </Badge>
      </TooltipTrigger>

      <TooltipContent>
        <p>
          Height: {height}, Width: {width}, Quantity: {quantity}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const getStockSummary = (product: IProduct): IStockSummary => {
  return (
    product.stockSummary || {
      shopStocks: {},
      storeStocks: {},
      totalShopStock: 0,
      totalStoreStock: 0,
      totalStock: 0,
      shopDimensionStocks: {},
      storeDimensionStocks: {},
      totalShopDimensionPieces: 0,
      totalStoreDimensionPieces: 0,
      totalDimensionPieces: 0,
      totalShopDimensionArea: 0,
      totalStoreDimensionArea: 0,
      totalDimensionArea: 0,
      totalAllItems: 0,
      hasDimensionStock: false,
      hasQuantityStock: false,
    }
  );
};

export const productColumns: ColumnDef<IProduct>[] = [
  {
    accessorKey: 'productCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Code' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
    enableColumnFilter: true,
  },

  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Product Name' />
    ),
    cell: ({ cell }) => (
      <div className='flex items-center gap-2'>
        <Package className='h-4 w-4 text-muted-foreground' />
        {cell.getValue<string>()}
      </div>
    ),
    enableColumnFilter: true,
  },

  {
    accessorKey: 'fabricName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fabric' />
    ),
    cell: ({ cell }) => (
      <div className='flex items-center gap-2'>
        <Layers className='h-4 w-4 text-muted-foreground' />
        {cell.getValue<string>() || '-'}
      </div>
    ),
  },

  {
    id: 'curtainType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Curtain Type' />
    ),
    cell: ({ row }) => {
      const {
        thickCurtain,
        thinCurtain,
        pullsCurtain,
        poleCurtain,
        bracketsCurtain,
        shatterVertical,
      } = row.original;

      const types = [
        thickCurtain && 'Thick',
        thinCurtain && 'Thin',
        pullsCurtain && 'Belt',
        poleCurtain && 'Curtain Rod',
        bracketsCurtain && 'Holder',
        shatterVertical && 'Shutter/Vertical',
      ].filter(Boolean);

      return (
        <span className='text-sm'>
          {types.length > 0 ? types.join(', ') : 'None'}
        </span>
      );
    },
  },

  {
    id: 'stockType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stock Type' />
    ),
    cell: ({ row }) => {
      const stockSummary = getStockSummary(row.original);
      const { hasDimensionStock, hasQuantityStock } = stockSummary;

      if (hasDimensionStock && hasQuantityStock) {
        return (
          <Badge
            variant='outline'
            className='
              border-purple-200
              bg-purple-50
              text-purple-700
              dark:border-purple-900/40
              dark:bg-purple-950/20
              dark:text-purple-300
            '
          >
            Mixed
          </Badge>
        );
      }

      if (hasDimensionStock) {
        return (
          <Badge
            variant='outline'
            className='
              border-blue-200
              bg-blue-50
              text-blue-700
              dark:border-blue-900/40
              dark:bg-blue-950/20
              dark:text-blue-300
            '
          >
            Dimension
          </Badge>
        );
      }

      if (hasQuantityStock) {
        return (
          <Badge
            variant='outline'
            className='
              border-green-200
              bg-green-50
              text-green-700
              dark:border-green-900/40
              dark:bg-green-950/20
              dark:text-green-300
            '
          >
            Quantity
          </Badge>
        );
      }

      return (
        <Badge
          variant='outline'
          className='
            border-border
            bg-muted/50
            text-muted-foreground
          '
        >
          No Stock
        </Badge>
      );
    },

    enableSorting: true,
    enableColumnFilter: true,

    filterFn: (row, id, filterValue) => {
      const stockSummary = getStockSummary(row.original);
      const { hasDimensionStock, hasQuantityStock } = stockSummary;

      if (filterValue === 'dimension') return hasDimensionStock;
      if (filterValue === 'quantity') return hasQuantityStock;
      if (filterValue === 'mixed')
        return hasDimensionStock && hasQuantityStock;
      if (filterValue === 'none')
        return !hasDimensionStock && !hasQuantityStock;

      return true;
    },
  },

  {
    id: 'shopStocks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Shop Stock' />
    ),

    cell: ({ row }) => {
      const stockSummary = getStockSummary(row.original);
      const { shopStocks, shopDimensionStocks } = stockSummary;

      return (
        <div className='space-y-2'>
          {Object.entries(shopStocks).map(([shopName, stockInfo]) => (
            <div key={shopName} className='text-sm'>
              <div className='flex items-center gap-1'>
                <ShoppingCart className='h-3 w-3 text-blue-500 dark:text-blue-400' />

                <span className='font-medium'>{shopName}:</span>

                <span className='ml-1 text-muted-foreground'>
                  {stockInfo.quantity || 0} units
                </span>

                {stockInfo.branchName && (
                  <span className='ml-1 text-xs text-muted-foreground'>
                    ({stockInfo.branchName})
                  </span>
                )}
              </div>
            </div>
          ))}

          {Object.entries(shopDimensionStocks).map(
            ([shopName, dimensionInfo]) => {
              if (dimensionInfo.pieces === 0) return null;

              return (
                <div key={`dim-${shopName}`} className='text-sm'>
                  <div className='flex items-center gap-1'>
                    <Ruler className='h-3 w-3 text-purple-500 dark:text-purple-400' />

                    <span className='font-medium'>{shopName}:</span>

                    <span className='ml-1 text-muted-foreground'>
                      {dimensionInfo.pieces} pieces
                    </span>

                    {dimensionInfo.dimensions.length > 0 && (
                      <div className='mt-1 flex flex-wrap gap-1'>
                        {dimensionInfo.dimensions
                          .slice(0, 2)
                          .map((dim, idx) => (
                            <DimensionBadge
                              key={idx}
                              height={dim.height}
                              width={dim.width}
                              quantity={dim.quantity}
                            />
                          ))}

                        {dimensionInfo.dimensions.length > 2 && (
                          <Badge
                            variant='outline'
                            className='
                              text-xs
                              border-border
                              bg-muted/50
                            '
                          >
                            +{dimensionInfo.dimensions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}

          {Object.keys(shopStocks).length === 0 &&
            Object.values(shopDimensionStocks).every(
              (d: IDimensionStockInfo) => d.pieces === 0
            ) && (
              <span className='text-sm text-muted-foreground'>
                No stock
              </span>
            )}
        </div>
      );
    },

    enableSorting: false,
    enableColumnFilter: false,
  },

  {
    id: 'storeStocks',

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Store Stock' />
    ),

    cell: ({ row }) => {
      const stockSummary = getStockSummary(row.original);
      const { storeStocks, storeDimensionStocks } = stockSummary;

      return (
        <div className='space-y-2'>
          {Object.entries(storeStocks).map(([storeName, stockInfo]) => (
            <div key={storeName} className='text-sm'>
              <div className='flex items-center gap-1'>
                <Store className='h-3 w-3 text-green-500 dark:text-green-400' />

                <span className='font-medium'>{storeName}:</span>

                <span className='ml-1 text-muted-foreground'>
                  {stockInfo.quantity || 0} units
                </span>

                {stockInfo.branchName && (
                  <span className='ml-1 text-xs text-muted-foreground'>
                    ({stockInfo.branchName})
                  </span>
                )}
              </div>
            </div>
          ))}

          {Object.entries(storeDimensionStocks).map(
            ([storeName, dimensionInfo]) => {
              if (dimensionInfo.pieces === 0) return null;

              return (
                <div key={`dim-${storeName}`} className='text-sm'>
                  <div className='flex items-center gap-1'>
                    <Ruler className='h-3 w-3 text-purple-500 dark:text-purple-400' />

                    <span className='font-medium'>{storeName}:</span>

                    <span className='ml-1 text-muted-foreground'>
                      {dimensionInfo.pieces} pieces
                    </span>

                    {dimensionInfo.dimensions.length > 0 && (
                      <div className='mt-1 flex flex-wrap gap-1'>
                        {dimensionInfo.dimensions
                          .slice(0, 2)
                          .map((dim, idx) => (
                            <DimensionBadge
                              key={idx}
                              height={dim.height}
                              width={dim.width}
                              quantity={dim.quantity}
                            />
                          ))}

                        {dimensionInfo.dimensions.length > 4 && (
                          <Badge
                            variant='outline'
                            className='
                              text-xs
                              border-border
                              bg-muted/50
                            '
                          >
                            +{dimensionInfo.dimensions.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}

          {Object.keys(storeStocks).length === 0 &&
            Object.values(storeDimensionStocks).every(
              (d: IDimensionStockInfo) => d.pieces === 0
            ) && (
              <span className='text-sm text-muted-foreground'>
                No stock
              </span>
            )}
        </div>
      );
    },

    enableSorting: false,
    enableColumnFilter: false,
  },

  {
    id: 'totalStock',

    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Branch Stock Summary'
      />
    ),

    cell: ({ row }) => {
      const stockSummary = getStockSummary(row.original);

      const {
        shopStocks,
        storeStocks,
        shopDimensionStocks,
        storeDimensionStocks,
        totalStock,
        totalDimensionPieces,
        totalAllItems,
      } = stockSummary;

      const shopBranchTotals: Record<
        string,
        { quantity: number; pieces: number; area: number }
      > = {};

      const storeBranchTotals: Record<
        string,
        { quantity: number; pieces: number; area: number }
      > = {};

      const combinedBranchTotals: Record<
        string,
        {
          quantity: number;
          pieces: number;
          area: number;
          total: number;
        }
      > = {};

      Object.entries(shopStocks).forEach(([, stockInfo]) => {
        const branchName = stockInfo.branchName || 'Unknown Branch';
        const quantity = stockInfo.quantity || 0;

        if (!shopBranchTotals[branchName]) {
          shopBranchTotals[branchName] = {
            quantity: 0,
            pieces: 0,
            area: 0,
          };
        }

        shopBranchTotals[branchName].quantity += quantity;
      });

      Object.entries(shopDimensionStocks).forEach(
        ([shopName, dimensionInfo]) => {
          if (dimensionInfo.pieces > 0) {
            const shop = Object.entries(shopStocks).find(
              ([name]) => name === shopName
            )?.[1];

            const branchName =
              shop?.branchName || 'Unknown Branch';

            if (!shopBranchTotals[branchName]) {
              shopBranchTotals[branchName] = {
                quantity: 0,
                pieces: 0,
                area: 0,
              };
            }

            shopBranchTotals[branchName].pieces +=
              dimensionInfo.pieces;

            shopBranchTotals[branchName].area +=
              dimensionInfo.totalArea;
          }
        }
      );

      Object.entries(storeStocks).forEach(([, stockInfo]) => {
        const branchName = stockInfo.branchName || 'Unknown Branch';
        const quantity = stockInfo.quantity || 0;

        if (!storeBranchTotals[branchName]) {
          storeBranchTotals[branchName] = {
            quantity: 0,
            pieces: 0,
            area: 0,
          };
        }

        storeBranchTotals[branchName].quantity += quantity;
      });

      Object.entries(storeDimensionStocks).forEach(
        ([storeName, dimensionInfo]) => {
          if (dimensionInfo.pieces > 0) {
            const store = Object.entries(storeStocks).find(
              ([name]) => name === storeName
            )?.[1];

            const branchName =
              store?.branchName || 'Unknown Branch';

            if (!storeBranchTotals[branchName]) {
              storeBranchTotals[branchName] = {
                quantity: 0,
                pieces: 0,
                area: 0,
              };
            }

            storeBranchTotals[branchName].pieces +=
              dimensionInfo.pieces;

            storeBranchTotals[branchName].area +=
              dimensionInfo.totalArea;
          }
        }
      );

      const allBranches = Array.from(
        new Set([
          ...Object.keys(shopBranchTotals),
          ...Object.keys(storeBranchTotals),
        ])
      ).sort();

      allBranches.forEach((branchName) => {
        const shopData = shopBranchTotals[branchName] || {
          quantity: 0,
          pieces: 0,
          area: 0,
        };

        const storeData = storeBranchTotals[branchName] || {
          quantity: 0,
          pieces: 0,
          area: 0,
        };

        combinedBranchTotals[branchName] = {
          quantity: shopData.quantity + storeData.quantity,
          pieces: shopData.pieces + storeData.pieces,
          area: shopData.area + storeData.area,
          total:
            shopData.quantity +
            storeData.quantity +
            shopData.pieces +
            storeData.pieces,
        };
      });

      return (
        <div className='min-w-75 space-y-3'>
          <div className='flex gap-2 border-b border-border pb-2 text-xs dark:border-border'>
            <Badge
              variant='outline'
              className='
                border-green-200
                bg-green-50
                text-green-700
                dark:border-green-900/40
                dark:bg-green-950/20
                dark:text-green-300
              '
            >
              Units: {totalStock}
            </Badge>

            <Badge
              variant='outline'
              className='
                border-blue-200
                bg-blue-50
                text-blue-700
                dark:border-blue-900/40
                dark:bg-blue-950/20
                dark:text-blue-300
              '
            >
              Pieces: {totalDimensionPieces}
            </Badge>

            <Badge
              variant='outline'
              className='
                border-amber-200
                bg-amber-50
                text-amber-700
                dark:border-amber-900/40
                dark:bg-amber-950/20
                dark:text-amber-300
              '
            >
              Total: {totalAllItems}
            </Badge>
          </div>

          {allBranches.length > 0 ? (
            <div className='space-y-2'>
              {allBranches.map((branchName) => {
                const branchData =
                  combinedBranchTotals[branchName];

                const shopData = shopBranchTotals[
                  branchName
                ] || {
                  quantity: 0,
                  pieces: 0,
                  area: 0,
                };

                const storeData = storeBranchTotals[
                  branchName
                ] || {
                  quantity: 0,
                  pieces: 0,
                  area: 0,
                };

                return (
                  <div
                    key={branchName}
                    className='
                      space-y-1
                      rounded-lg
                      border
                      border-border
                      bg-muted/20
                      p-2
                    '
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Package className='h-3 w-3 text-amber-500 dark:text-amber-400' />

                        <span className='text-sm font-medium'>
                          {branchName}
                        </span>
                      </div>

                      <span className='text-sm font-bold'>
                        {branchData.total}
                      </span>
                    </div>

                    <div className='ml-5 space-y-1 text-xs text-muted-foreground'>
                      {(shopData.quantity > 0 ||
                        shopData.pieces > 0) && (
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1'>
                            <ShoppingCart className='h-2.5 w-2.5 text-blue-500 dark:text-blue-400' />

                            <span>Shops:</span>
                          </div>

                          <div className='flex gap-2'>
                            {shopData.quantity > 0 && (
                              <span>
                                {shopData.quantity} units
                              </span>
                            )}

                            {shopData.pieces > 0 && (
                              <span className='text-purple-600 dark:text-purple-400'>
                                {shopData.pieces} pcs
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {(storeData.quantity > 0 ||
                        storeData.pieces > 0) && (
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1'>
                            <Store className='h-2.5 w-2.5 text-green-500 dark:text-green-400' />

                            <span>Stores:</span>
                          </div>

                          <div className='flex gap-2'>
                            {storeData.quantity > 0 && (
                              <span>
                                {storeData.quantity} units
                              </span>
                            )}

                            {storeData.pieces > 0 && (
                              <span className='text-purple-600 dark:text-purple-400'>
                                {storeData.pieces} pcs
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>
              No stock in any branch
            </span>
          )}

          <div className='space-y-2 border-t border-border pt-2'>
            <div className='flex items-center justify-between pt-2 text-sm font-bold'>
              <div className='flex items-center gap-2'>
                <Package className='h-3 w-3 text-amber-500 dark:text-amber-400' />

                <span>Total Items:</span>
              </div>

              <span className='text-lg'>{totalAllItems}</span>
            </div>
          </div>
        </div>
      );
    },

    enableSorting: true,

    sortingFn: (rowA, rowB) => {
      const getTotalItems = (row: any) => {
        const stockSummary = getStockSummary(row.original);
        return stockSummary.totalAllItems || 0;
      };

      const totalA = getTotalItems(rowA);
      const totalB = getTotalItems(rowB);

      return totalA - totalB;
    },

    enableColumnFilter: false,
  },

  {
    accessorKey: 'createdAt',

    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),

    cell: ({ cell }) => {
      const date = cell.getValue<IProduct['createdAt']>();

      return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CalendarDays className='h-4 w-4' />

          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },

    enableColumnFilter: false,
  },

  {
    id: 'actions',
    cell: ({ row }) => (
      <ProductCellAction data={row.original} />
    ),
  },
];