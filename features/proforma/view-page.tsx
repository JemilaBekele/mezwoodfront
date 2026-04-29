"use client";

import { useEffect, useState } from "react";
import FormCardSkeleton from "@/components/form-card-skeleton";

import type { IProforma } from "@/models/proforma";
import { getProformaById } from "@/service/proforma";

import ProformaForm from "./form";

type TProformaViewPageProps = {
  proformaId: string;
};

export default function ProformaViewPage({
  proformaId,
}: TProformaViewPageProps) {
  const [proforma, setProforma] = useState<IProforma | null>(null);
  const [loading, setLoading] = useState(proformaId !== "new");

  useEffect(() => {
    let cancelled = false;

    const loadProforma = async () => {
      if (proformaId === "new") {
        setLoading(false);
        return;
      }

      try {
        const data = await getProformaById(proformaId);

        if (!cancelled) {
          setProforma(data as IProforma);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProforma();

    return () => {
      cancelled = true;
    };
  }, [proformaId]);

  if (loading) {
    return <FormCardSkeleton />;
  }

  return (
    <ProformaForm
      initialData={proforma}
      isEdit={proformaId !== "new"}
    />
  );
}