/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCompanies } from '@/service/companyService';
import { IProformaInvoice, IProformaInvoiceItem } from '@/models/ProformaInvoice';
import { Loader2, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getProformaInvoiceById } from '@/service/ProformaInvoice';
import { normalizeImagePath } from './detail';
import Image from "next/image";

export default function PublicProformaView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<IProformaInvoice | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Exact colors matching the image
  const BRAND_BROWN = "rgb(164, 90, 42)"; // Darker banner brown
  const TEXT_BROWN = "rgb(170, 70, 35)";  // Lighter text brown

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceData, companies] = await Promise.all([
          getProformaInvoiceById(id as string),
          getCompanies()
        ]);
        setInvoice(invoiceData);
        if (companies && companies.length > 0) setCompany(companies[0]);
      } catch (error) {
        toast.error("Could not load proforma invoice");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#A45A2A]" />
    </div>
  );

  if (!invoice || !company) return <div className="p-10 text-center text-slate-500 font-medium">Invoice not found.</div>;

  const subtotal = invoice.subtotal || 0;
  const vat = invoice.vat || (subtotal * 0.15);
  const total = invoice.total || (subtotal + vat);
  const customerData = (invoice as any).customer || {};

  // Format date exactly like "Jan,2026"
  const formattedDate = new Date(invoice.createdAt || new Date()).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  }).replace(' ', ',');

  return (
    <div className="min-h-screen bg-white py-10 px-4 font-sans print:py-0 print:px-0">
      <div className="mx-auto max-w-225 bg-white print:max-w-full">
        
        {/* --- HEADER: LOGO & COMPANY NAME --- */}
        <div className="flex items-center gap-6 pb-4">
     
{company.logo ? (
  <Image
    src={normalizeImagePath(company.logo)}
    alt="Company Logo"
    width={160}
    height={96}
    className="h-24 w-auto object-contain"
    unoptimized
  />
) : (
  <div className="h-24 w-40 bg-gray-100 flex items-center justify-center font-bold text-gray-400">
    LOGO
  </div>
)}
          
          {/* Vertical brown divider */}
          <div className="h-20 w-1" style={{ backgroundColor: BRAND_BROWN }} />
          
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-black tracking-tight">{company.name}</h1>
            {/* Amharic Text exactly as shown in the image */}
            <h2 className="text-2xl font-bold text-black mt-1">ሮዝውድ ከስተም ፈርኒቸር</h2>
          </div>
        </div>

        {/* --- CONTACT BANNER --- */}
        <div 
          className="w-full text-white px-8 py-5 flex flex-col md:flex-row justify-between gap-6 text-[15px]" 
          style={{ backgroundColor: BRAND_BROWN }}
        >
          {/* Left Column (Socials & Contact) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {/* Custom simple TikTok icon representation */}
              <div className="flex items-center justify-center w-[18px] h-[18px] border-[1.5px] border-white rounded-full">
                <span className="text-[10px] font-bold">d</span>
              </div>
              <span>{company.tiktok || '@rosewood.furniture'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} fill="white" className="text-white" /> 
              <span>{company.phone || '+251 905 84 85 86'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} /> 
              <span>{company.email || 'rosewoodcf@gmail.com'}</span>
            </div>
          </div>
          
          {/* Right Column (Addresses) */}
          <div className="space-y-3 md:pr-10">
            <div className="flex items-start gap-3">
              <MapPin size={18} fill="white" className="text-white shrink-0 mt-0.5" />
              <span>{company.address || 'Ayat round about road to tafo'}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} fill="white" className="text-white shrink-0 mt-0.5" />
              <span className="max-w-[250px] leading-tight">
                {company.addressTow || 'Ayertena round about infront of Shewa supermarket'}
              </span>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER & DATE --- */}
        <div className="mt-10">
          <div className="flex justify-between items-end border-b-[3px] border-black pb-1 mb-1">
            <p className="text-[15px] font-medium text-black">
              To:{customerData.companyName || customerData.name || 'Amsal Resort (Hosana)'}
            </p>
            <p className="text-[15px] font-medium text-black">
              {formattedDate}
            </p>
          </div>
          <div className="flex justify-between font-bold text-[15px]" style={{ color: TEXT_BROWN }}>
            <p>PROFORMA INVOCE</p>
            <p className="pr-[200px]">To:</p>
          </div>
        </div>

        {/* --- ITEMS TABLE --- */}
        <table className="w-full text-left mt-4 border-collapse">
          <thead>
            <tr className="font-bold text-[15px]" style={{ color: TEXT_BROWN }}>
              <th className="py-2 border-y-[3px] border-black w-8">#</th>
              <th className="py-2 border-y-[3px] border-black w-32">Item</th>
              <th className="py-2 border-y-[3px] border-black">Item description</th>
              <th className="py-2 border-y-[3px] border-black text-center w-24">Unit<br/>price</th>
              <th className="py-2 border-y-[3px] border-black text-center w-20">Qty/sq</th>
              <th className="py-2 border-y-[3px] border-black text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="text-[15px] text-black">
            {invoice.items?.map((item: IProformaInvoiceItem, index: number) => (
              <tr key={index} className="border-b-[3px] border-black">
                <td className="py-4 align-top font-bold">{index + 1}</td>
                <td className="py-4 align-top font-bold uppercase">{item.item?.name || 'ITEM'}</td>
                <td className="py-4 align-top">
                  <p style={{ color: TEXT_BROWN }}>{item.description || item.size || 'No description'}</p>
                  {item.images?.[0] && (
                    <img 
                      src={normalizeImagePath(item.images[0].imageUrl)} 
                      className="mt-2 h-40 w-[260px] object-cover bg-gray-100"
                      alt="Product"
                    />
                  )}
                </td>
                <td className="py-4 align-top text-center tabular-nums">{item.unitPrice.toLocaleString()}</td>
                <td className="py-4 align-top text-center">{item.quantity}</td>
                <td className="py-4 align-top text-right tabular-nums">{item.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- SUMMARY SECTION --- */}
      {/* --- SUMMARY SECTION (UPDATED) --- */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-end">
          
          {/* Left side: Prepared By */}
          <div className="text-[13px] text-gray-500 mb-4 md:mb-0 leading-relaxed">
            <p>Prepared by : {invoice.preparedBy?.name || 'Mukerem (Gm)'}</p>
            <p>{invoice.preparedBy?.phone || '0905 848586'}</p>
          </div>

          {/* Right side: Totals */}
          <div className="w-full md:w-80 pr-2">
            <div className="space-y-3 text-[16px]">
              <div className="flex justify-between font-bold italic text-black">
                <span>Sub Total</span>
                <span className="tabular-nums not-italic">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold italic text-gray-500">
                <span>15 % VAT</span>
                <span className="tabular-nums not-italic">{vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold italic text-gray-500">
                <span>Grand Total</span>
                <span className="tabular-nums not-italic">{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
      </div>

      </div>
    </div>
  );
}