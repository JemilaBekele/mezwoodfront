// sales-view-page.tsx
"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";
import type { ISell } from "@/models/Sell";
import { getItems } from "@/service/item";
import { IItem } from "@/models/item";
import { getSellById } from "@/service/Sell";
import ProductSearch from "./form";

type SalesViewPageProps = {
  sellId: string;
};

export default function SalesViewPage({ sellId }: SalesViewPageProps) {
  const [sell, setSell] = useState<ISell | undefined>(undefined);
  const [products, setProducts] = useState<IItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSellPage = async () => {
      try {
        const productsData = await getItems();
        
        let sellData = null;
        if (sellId !== "new") {
          sellData = await getSellById(sellId);
          console.log("Fetched sell data in view-page:", sellData);
        }

        if (cancelled) {
          return;
        }

        setProducts(productsData || []);
        setSell((sellData as ISell) || undefined);
      } catch (error) {
        console.error("Error loading sell page:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSellPage();

    return () => {
      cancelled = true;
    };
  }, [sellId]);

  if (loading) {
    return <FormCardSkeleton />;
  }



  // Use ProductSearch directly
  return (
    <ProductSearch 
      items={products} 
      initialSellData={sell} 
      sellId={sellId}
    />
  );
}