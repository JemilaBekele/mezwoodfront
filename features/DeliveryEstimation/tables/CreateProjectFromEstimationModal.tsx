'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import {
  createProjectFromDeliveryEstimation,
  getAllOnHoldDeliveryEstimations,
} from '@/service/delivery-estimation';

import { IDeliveryEstimation } from '@/models/delivery-estimation';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { getProformaInvoices } from '@/service/ProformaInvoice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectFromEstimationModal({
  isOpen,
  onClose,
}: Props) {
  const [estimations, setEstimations] = useState<IDeliveryEstimation[]>([]);
  const [pis, setPis] = useState<IProformaInvoice[]>([]);
  const [filteredPis, setFilteredPis] = useState<IProformaInvoice[]>([]);

  const [selectedEstimation, setSelectedEstimation] = useState('');
  const [selectedPi, setSelectedPi] = useState('');

  const [searchPi, setSearchPi] = useState('');
  const [loading, setLoading] = useState(false);

  /* ------------ Load data ------------ */
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        const estimationsRes = await getAllOnHoldDeliveryEstimations();
        setEstimations(estimationsRes);

        const invoices = await getProformaInvoices();
        setPis(invoices);
        setFilteredPis(invoices);
      } catch {
        toast.error('Failed to load data');
      }
    };

    load();
  }, [isOpen]);

  /* ------------ Search PI ------------ */
  useEffect(() => {
    const filtered = pis.filter((pi) =>
      pi.piNumber.toLowerCase().includes(searchPi.toLowerCase())
    );
    setFilteredPis(filtered);
  }, [searchPi, pis]);

  /* ------------ Submit ------------ */
  const onCreateProject = async () => {
    if (!selectedEstimation || !selectedPi) {
      toast.error('Select estimation and PI');
      return;
    }

    setLoading(true);
    try {
      await createProjectFromDeliveryEstimation({
        deliveryEstimationCode: selectedEstimation,
        proformaInvoiceId: selectedPi,
      });

      toast.success('Project created successfully');
      onClose();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Project"
      description="Select Delivery Estimation and PI"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">

        {/* -------- Delivery Estimation -------- */}
        <div>
          <label className="text-sm font-medium">
            Delivery Estimation Code
          </label>

          <select
            className="w-full border rounded p-2"
            value={selectedEstimation}
            onChange={(e) => setSelectedEstimation(e.target.value)}
          >
            <option value="">Select Estimation</option>
            {estimations.map((e) => (
              <option key={e.id} value={e.code}>
                {e.code}
              </option>
            ))}
          </select>
        </div>

        {/* -------- PI Search -------- */}
        <div>
          <label className="text-sm font-medium">
            Search PI Number
          </label>
          <Input
            placeholder="Search PI..."
            value={searchPi}
            onChange={(e) => setSearchPi(e.target.value)}
          />
        </div>

        {/* -------- PI Select -------- */}
        <div>
          <label className="text-sm font-medium">
            Proforma Invoice
          </label>

          <select
            className="w-full border rounded p-2"
            value={selectedPi}
            onChange={(e) => setSelectedPi(e.target.value)}
          >
            <option value="">Select PI</option>
            {filteredPis.map((pi) => (
              <option key={pi.id} value={pi.id}>
                {pi.piNumber} — {pi.customer?.name}
              </option>
            ))}
          </select>
        </div>

        {/* -------- Submit -------- */}
        <Button onClick={onCreateProject} disabled={loading}>
          Create Project
        </Button>
      </div>
    </Modal>
  );
}