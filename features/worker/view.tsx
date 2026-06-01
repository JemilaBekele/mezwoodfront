"use client";

import { IShop } from "@/models/shop";
import { useState } from "react";
import WorkerCommissionReport from "./workcomission";

interface WorkerCommissionReportWrapperProps {
  shops: IShop[];
}

const WorkerCommissionReportWrapper: React.FC<
  WorkerCommissionReportWrapperProps
> = ({ shops }) => {
  const [shopId, setShopId] = useState<string | undefined>();

  return (
    <div className="space-y-6">

      {/* Shop Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Select Shop
        </label>

        <select
          className="
            h-11
            w-[250px]
            rounded-lg
            border
            border-border
            bg-background
            px-3
            text-sm
            text-foreground
            shadow-sm
            transition-colors
            outline-none
            focus:border-primary
            focus:ring-2
            focus:ring-primary/20
            dark:bg-card
            dark:border-border
            dark:text-foreground
          "
          value={shopId || ""}
          onChange={(e) => setShopId(e.target.value)}
        >
          <option
            value=""
            className="bg-background text-foreground dark:bg-card dark:text-foreground"
          >
            Choose Shop
          </option>

          {shops?.map((shop) => (
            <option
              key={shop.id}
              value={shop.id}
              className="bg-background text-foreground dark:bg-card dark:text-foreground"
            >
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report */}
      {shopId && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <WorkerCommissionReport shopId={shopId} />
        </div>
      )}
    </div>
  );
};

export default WorkerCommissionReportWrapper;