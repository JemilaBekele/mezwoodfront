/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface SendToClientProps {
  invoiceId: string;
}

export const SendToClientButton: React.FC<SendToClientProps> = ({ invoiceId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      // Constructs the path /piclient/[id]
const baseUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');      const shareableLink = `${baseUrl}/piclient/${invoiceId}`;

      await navigator.clipboard.writeText(shareableLink);
      
      setCopied(true);
      toast.success('Client link copied to clipboard!');

      // Reset the icon back to the mail icon after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopyLink}
      className="transition-all duration-200"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          Link Copied
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Send to Client
        </>
      )}
    </Button>
  );
};