import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';
import { useGymSettings, type MemberCodeType } from '../context/GymSettingsContext';

interface MemberPrintCardProps {
  name: string;
  barcodeCode: string;
  membershipTier?: string | null;
}

function BarcodeSvg({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 2,
        height: 72,
        displayValue: true,
        fontSize: 14,
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      // Invalid barcode value — leave empty
    }
  }, [value]);

  return <svg ref={svgRef} className="max-w-full" />;
}

function MemberCode({ code, type }: { code: string; type: MemberCodeType }) {
  if (type === 'barcode') {
    return (
      <div className="bg-white rounded p-2 flex justify-center">
        <BarcodeSvg value={code} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded p-3 flex justify-center">
      <QRCodeSVG value={code} size={140} level="M" includeMargin />
    </div>
  );
}

export default function MemberPrintCard({ name, barcodeCode, membershipTier }: MemberPrintCardProps) {
  const { settings } = useGymSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3">
      <div
        id="member-print-card"
        className="member-print-card bg-white text-black rounded-xl border border-stone-300 p-6 max-w-xs mx-auto text-center space-y-3"
      >
        {settings.logo && (
          <img src={settings.logo} alt="" className="w-12 h-12 object-cover rounded mx-auto" />
        )}
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {settings.name}
        </p>
        <h3 className="text-lg font-black uppercase tracking-tight">{name}</h3>
        {membershipTier && (
          <p className="text-xs text-stone-600 uppercase tracking-wider">{membershipTier}</p>
        )}
        <MemberCode code={barcodeCode} type={settings.memberCodeType} />
        <p className="font-mono text-xs text-stone-700 tracking-widest">{barcodeCode}</p>
        <p className="text-[9px] text-stone-400 uppercase tracking-widest">
          Scan at front desk for check-in
        </p>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold py-3 rounded text-xs uppercase tracking-widest transition-colors"
      >
        <Printer size={14} className="text-red-500" />
        Print Member Card
      </button>
    </div>
  );
}
