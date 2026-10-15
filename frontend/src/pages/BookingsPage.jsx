import React, { useState } from 'react';
import { 
  FileText, 
  QrCode, 
  ShieldCheck, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const BookingsPage = () => {
  const [agreementStatus, setAgreementStatus] = useState('Drafted');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
            Booking & Tenancy Agreements
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Standardized digital rental contracts with cryptographic verification QR codes and secure test deposits.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Digital Agreement Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-10 bg-white shadow-apple border border-black/[0.08] relative">
            
            {/* Top Seal */}
            <div className="flex items-center justify-between border-b border-surface-200 pb-6 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/50">
                  RoomSync Tenancy Standard
                </span>
                <h2 className="text-xl font-bold text-ink-primary mt-1">Shared Accommodation Agreement</h2>
                <p className="text-xs text-ink-tertiary">Document ID: RS-AGR-2026-BLR-101 · Karnataka Stamp Ready</p>
              </div>

              {/* QR Verification Placeholder */}
              <div className="p-2 border border-surface-200 rounded-xl bg-surface-50 text-center shrink-0">
                <QrCode className="w-14 h-14 text-ink-primary mx-auto" />
                <span className="text-[9px] text-ink-tertiary block mt-1 font-mono">SCAN TO VERIFY</span>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-surface-50 p-4 rounded-xl border border-surface-200 mb-6">
              <div>
                <span className="text-ink-tertiary block uppercase text-[10px] font-semibold">Primary Host / Flatmate</span>
                <span className="font-semibold text-ink-primary block mt-0.5">Aditya Sharma</span>
                <span className="text-ink-secondary">Koramangala 4th Block, Bengaluru</span>
              </div>
              <div>
                <span className="text-ink-tertiary block uppercase text-[10px] font-semibold">Incoming Room Seeker</span>
                <span className="font-semibold text-ink-primary block mt-0.5">Shiva S.</span>
                <span className="text-ink-secondary">Verified Seeker Profile</span>
              </div>
            </div>

            {/* Agreement Terms */}
            <div className="space-y-4 text-xs text-ink-secondary leading-relaxed">
              <h3 className="font-bold text-sm text-ink-primary">Agreed Tenancy Terms & Clauses</h3>

              <div>
                <span className="font-semibold text-ink-primary">1. Monthly Rent & Maintenance:</span> ₹18,500 monthly rent payable by the 5th of each calendar month. Shared electricity, Wi-Fi, and housekeeping maintenance split equally at approximately ₹1,500/month.
              </div>

              <div>
                <span className="font-semibold text-ink-primary">2. Security Deposit:</span> A refundable security deposit of ₹50,000 shall be held securely. Deductions permitted only for documented damages or unpaid utility bills.
              </div>

              <div>
                <span className="font-semibold text-ink-primary">3. 22-Factor Living Concordat:</span> Both parties explicitly acknowledge agreement on:
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li>Quiet hours starting at 11:30 PM on weekdays.</li>
                  <li>Strict non-smoking policy inside premises and on balconies.</li>
                  <li>Overnight guests allowed with 24 hours prior communication.</li>
                </ul>
              </div>

              <div>
                <span className="font-semibold text-ink-primary">4. Notice Period:</span> Minimum 30 days written notice required before departure.
              </div>
            </div>

            {/* Signatures status */}
            <div className="mt-8 pt-6 border-t border-surface-200 grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Host Signed Digitally</span>
                </div>
                <p className="text-[11px] text-ink-tertiary">Aditya Sharma · Verified Phone OTP</p>
              </div>

              <div className="p-3 rounded-xl bg-brand-50/50 border border-brand-200">
                <div className="flex items-center gap-1.5 text-brand-800 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Ready for Seeker Signature</span>
                </div>
                <p className="text-[11px] text-ink-tertiary">Click below to confirm booking</p>
              </div>
            </div>

          </Card>
        </div>

        {/* Right Col: Token Payment & Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-subtle space-y-5">
            <h3 className="font-semibold text-base text-ink-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Token Deposit Checkout
            </h3>
            <p className="text-xs text-ink-secondary">
              Secure the room with a refundable token deposit. Protected by RoomSync Escrow.
            </p>

            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Token Booking Fee</span>
                <span className="font-semibold text-ink-primary">₹5,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Platform Processing</span>
                <span className="font-semibold text-emerald-700">₹0 (Free Beta)</span>
              </div>
              <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-sm text-ink-primary">
                <span>Total Payable</span>
                <span>₹5,000</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Razorpay Test Mode integration is active. No real funds will be charged.</span>
            </div>

            <Button 
              variant="primary" 
              className="w-full justify-center" 
              size="md"
              onClick={() => alert("Razorpay Sandbox Checkout triggered! In Phase 2, this initiates the test mode payment modal.")}
            >
              Sign & Pay ₹5,000 (Test Mode)
            </Button>
          </Card>

          {/* QR Verification Info */}
          <Card className="p-5 bg-surface-100 border border-black/[0.05] text-xs text-ink-secondary space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink-primary">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Cryptographic QR Verification</span>
            </div>
            <p className="leading-relaxed">
              Every finalized agreement features a tamper-proof QR stamp linking to the verified document hash, providing instant validation for landlords, society gates, and police verification.
            </p>
          </Card>
        </div>

      </div>

    </div>
  );
};
