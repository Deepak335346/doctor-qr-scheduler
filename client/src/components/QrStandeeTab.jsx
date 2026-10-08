import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Printer, Check, Wifi, Sparkles } from 'lucide-react';
import { authFetch } from '../utils/api.js';

export default function QrStandeeTab({ doctor }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [selectedBaseUrl, setSelectedBaseUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch network IPs from backend
    authFetch('/api/network-info')
      .then(r => r.json())
      .then(data => {
        setNetworkInfo(data);
        // Default to first network IP if available (so mobile devices can scan it!)
        if (data.networkIps && data.networkIps.length > 0) {
          setSelectedBaseUrl(data.networkIps[0].url);
        } else {
          setSelectedBaseUrl(data.localhost || window.location.origin);
        }
      })
      .catch(() => {
        setSelectedBaseUrl(window.location.origin);
      });
  }, []);

  // Compute final booking URL
  const bookingUrl = customUrl.trim()
    ? customUrl.trim()
    : `${selectedBaseUrl}`;

  // Fetch QR code image whenever bookingUrl changes
  useEffect(() => {
    if (!bookingUrl) return;
    setLoading(true);
    fetch(`/api/qr?url=${encodeURIComponent(bookingUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (data.dataUrl) setQrDataUrl(data.dataUrl);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `doctor-booking-qr-${doctor?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'clinic'}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Actions Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Clinic QR Code & Printable Desk Standee
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate scannable QR codes for your desk, reception, or waiting room poster.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Clinic Standee</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* URL Target Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Network Address for QR Code
            </label>
            <select
              value={selectedBaseUrl}
              onChange={(e) => {
                setSelectedBaseUrl(e.target.value);
                setCustomUrl('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {networkInfo?.networkIps?.map((n) => (
                <option key={n.ip} value={n.url}>
                  📶 Clinic Wi-Fi IP ({n.ip} - {n.interface}) [Scannable on Mobile]
                </option>
              ))}
              <option value={`http://localhost:${networkInfo?.port || 5000}`}>
                💻 Localhost (This Machine Only)
              </option>
              {window.location.origin !== `http://localhost:${networkInfo?.port || 5000}` && (
                <option value={window.location.origin}>
                  🌐 Current Browser Origin ({window.location.origin})
                </option>
              )}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-teal-600" />
              Select Wi-Fi IP so patients connected to clinic Wi-Fi can scan the QR code from their mobile cameras.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Or Custom Domain URL (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="e.g. https://apexclinic.com/book"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-teal-700 mt-1 truncate">
              Target: {bookingUrl}
            </p>
          </div>
        </div>
      </div>

      {/* Printable Clinic Standee Template (Printed when doctor presses Print) */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-teal-500 shadow-xl max-w-xl mx-auto text-center space-y-6 print-card relative">
        {/* Clinic Watermark / Corner Decoration */}
        <div className="absolute top-4 right-4 text-xs font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Official QR Standee
        </div>

        {/* Doctor Header */}
        <div className="space-y-1 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-md">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
            {doctor?.clinicName || 'Apex Medical & Wellness Clinic'}
          </h2>
          <p className="text-sm font-bold text-teal-700">
            {doctor?.name || 'Dr. Sarah Jenkins'} • {doctor?.specialty}
          </p>
          <p className="text-xs text-slate-500">
            {doctor?.chamber}
          </p>
        </div>

        {/* Large Prominent QR Code */}
        <div className="py-2 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-md inline-block">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Doctor Booking QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
            ) : null}
          </div>

          <div className="mt-3 px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Scan Camera to Book</span>
          </div>
        </div>

        {/* 3 Step Instruction Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 text-center mb-3">
            How It Works (Takes 30 Seconds)
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold inline-flex items-center justify-center text-xs">1</span>
              <p className="font-semibold text-slate-800">Scan QR</p>
              <p className="text-[10px] text-slate-500">Point phone camera</p>
            </div>
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold inline-flex items-center justify-center text-xs">2</span>
              <p className="font-semibold text-slate-800">Select Slot</p>
              <p className="text-[10px] text-slate-500">Choose free time</p>
            </div>
            <div className="space-y-1">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold inline-flex items-center justify-center text-xs">3</span>
              <p className="font-semibold text-slate-800">Get Token</p>
              <p className="text-[10px] text-slate-500">Instant digital pass</p>
            </div>
          </div>
        </div>

        {/* Footer Clinic Contact Info */}
        <div className="text-xs text-slate-500 border-t border-slate-100 pt-4 space-y-0.5">
          <p className="font-medium text-slate-700">{doctor?.address}</p>
          <p>Assistance & Reception: {doctor?.phone}</p>
          <p className="text-[10px] text-teal-700 font-mono mt-1">
            URL: {bookingUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
