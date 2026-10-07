import { useRef, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import Button from './ui/Button';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';

export default function Receipt({ transaction, onClose }) {
  const receiptRef = useRef(null);
  const { appLogo, receiptSettings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (receiptSettings.receipt_auto_print === 'true' || receiptSettings.receipt_auto_print === true) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [receiptSettings.receipt_auto_print]);

  if (!transaction) return null;

  const paperSize = receiptSettings.receipt_paper_size || '80mm';
  const paperWidth = paperSize === '58mm' ? '58mm' : '80mm';
  const fontSize = paperSize === '58mm' ? '10px' : '11px';

  // Preview di modal hanya menampilkan versi Konsumen
  const previewContent = (
    <CustomerReceipt 
      transaction={transaction} 
      formatRupiah={formatRupiah} 
      formatDate={formatDate}
      appLogo={appLogo}
      receiptSettings={receiptSettings}
      paperSize={paperSize}
      fontSize={fontSize}
    />
  );

  return (
    <>
      {/* 1. Overlay Modal (Hidden saat print) */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-lg text-gray-900">Preview Struk</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-gray-100 max-h-[70vh] overflow-y-auto">
            <div 
              className="receipt-container bg-white p-4 mx-auto shadow-sm" 
              ref={receiptRef}
              style={{ fontFamily: "'Courier New', monospace", fontSize: fontSize, width: paperWidth }}
            >
              {previewContent}
            </div>
          </div>

          <div className="p-4 border-t flex gap-2 bg-white">
            <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" /> Cetak 3 Rangkap
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Hidden Print Version (Rendered di body untuk print 3 rangkap) */}
      {createPortal(
        <div className="print-only-container">
          
          {/* RANGKAP 1: KONSUMEN */}
          <div className="print-receipt" style={{ width: paperWidth, fontSize: fontSize, fontFamily: "'Courier New', monospace" }}>
            <CustomerReceipt transaction={transaction} formatRupiah={formatRupiah} formatDate={formatDate} appLogo={appLogo} receiptSettings={receiptSettings} paperSize={paperSize} fontSize={fontSize} />
          </div>
          
          <div className="page-break"></div>

          {/* RANGKAP 2: DAPUR */}
          <div className="print-receipt" style={{ width: paperWidth, fontSize: fontSize, fontFamily: "'Courier New', monospace" }}>
            <KitchenReceipt transaction={transaction} formatRupiah={formatRupiah} formatDate={formatDate} paperSize={paperSize} fontSize={fontSize} />
          </div>

          <div className="page-break"></div>

          {/* RANGKAP 3: ARSIP KASIR */}
          <div className="print-receipt" style={{ width: paperWidth, fontSize: fontSize, fontFamily: "'Courier New', monospace" }}>
            <ArchiveReceipt transaction={transaction} formatRupiah={formatRupiah} formatDate={formatDate} receiptSettings={receiptSettings} paperSize={paperSize} fontSize={fontSize} />
          </div>

        </div>,
        document.body
      )}
    </>
  );
}

// ==========================================
// 1. KOMPONEN STRUK KONSUMEN
// ==========================================
function CustomerReceipt({ transaction, formatRupiah, formatDate, appLogo, receiptSettings, paperSize, fontSize }) {
  const showLogo = receiptSettings.receipt_show_logo === 'true' || receiptSettings.receipt_show_logo === true;
  const businessName = receiptSettings.business_name || 'WARUNG BAKSO';
  const businessAddress = receiptSettings.business_address || 'Jl. Contoh No. 123';
  const businessPhone = receiptSettings.business_phone || '0812-3456-7890';
  const businessFooter = receiptSettings.business_footer || 'Terima kasih atas kunjungan Anda!';
  const logoUrl = appLogo ? (appLogo.startsWith('http') ? appLogo : `http://localhost:8000${appLogo}`) : null;
  const discAmount = parseFloat(transaction.discount_amount) || 0;

  return (
    <div style={{ lineHeight: '1.4', color: '#000' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        {showLogo && logoUrl && <img src={logoUrl} alt="Logo" style={{ maxWidth: paperSize === '58mm' ? '40px' : '60px', margin: '0 auto 8px', display: 'block' }} />}
        <h2 style={{ fontWeight: 'bold', fontSize: parseInt(fontSize) + 4, margin: '0 0 4px 0', textTransform: 'uppercase' }}>{businessName}</h2>
        <p style={{ margin: '2px 0', fontSize: fontSize }}>{businessAddress}</p>
        <p style={{ margin: '2px 0', fontSize: fontSize }}>Telp: {businessPhone}</p>
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>No:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.invoice_number}</span>
        </div>
        
        {/* ✅ TAMBAHAN: Nama Pelanggan di Struk Konsumen */}
        {transaction.customer_name && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Pelanggan:</span>
            <span style={{ fontWeight: 'bold' }}>{transaction.customer_name}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tgl:</span>
          <span>{formatDate(transaction.transacted_at || transaction.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir:</span>
          <span>{transaction.cashier?.name || transaction.cashier_name || '-'}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        {transaction.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold' }}>{item.product_name || item.product?.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.subtotal || (item.price * item.qty))}</span>
            </div>
            {item.add_ons?.length > 0 && item.add_ons.map((addOn, aIdx) => (
              <div key={aIdx} style={{ display: 'flex', justifyContent: 'space-between', color: '#555', marginLeft: '8px' }}>
                <span>+ {addOn.name}</span><span>{formatRupiah(addOn.price)}</span>
              </div>
            ))}
            {item.notes && <div style={{ color: '#444', fontStyle: 'italic' }}>- {item.notes}</div>}
          </div>
        ))}
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatRupiah(transaction.subtotal)}</span></div>
        {discAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}><span>Diskon</span><span>- {formatRupiah(discAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: parseInt(fontSize) + 3, marginTop: '6px', borderTop: '1px solid #000', paddingTop: '4px' }}>
          <span>TOTAL</span><span>{formatRupiah(transaction.total)}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'capitalize' }}><span>Bayar ({transaction.payment_method || 'Tunai'})</span><span>{formatRupiah(transaction.paid)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Kembali</span><span>{formatRupiah(transaction.change)}</span></div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: fontSize }}>
        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{businessFooter}</p>
      </div>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN STRUK DAPUR (Fokus Qty, Catatan & Nama Pelanggan)
// ==========================================
function KitchenReceipt({ transaction, formatRupiah, formatDate, paperSize, fontSize }) {
  const bigFontSize = parseInt(fontSize) + 6; // Font lebih besar untuk dapur

  return (
    <div style={{ lineHeight: '1.4', color: '#000' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px', border: '2px solid #000', padding: '4px' }}>
        <h2 style={{ fontWeight: '900', fontSize: bigFontSize + 4, margin: 0, letterSpacing: '1px' }}>ORDER DAPUR</h2>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize, borderBottom: '1px dashed #000', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>INV: {transaction.invoice_number}</span>
          <span>{formatDate(transaction.transacted_at || transaction.created_at)}</span>
        </div>
        
        {/* ✅ TAMBAHAN: Nama Pelanggan di Struk Dapur (Font Besar & Jelas) */}
        {transaction.customer_name && (
          <div style={{ marginTop: '8px', textAlign: 'center', fontWeight: '900', fontSize: parseInt(fontSize) + 4, letterSpacing: '1px' }}>
            👤 {transaction.customer_name.toUpperCase()}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        {transaction.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px dotted #999' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: '900', fontSize: bigFontSize }}>{item.qty}x</span>
              <span style={{ fontWeight: 'bold', fontSize: bigFontSize, flex: 1 }}>{item.product_name || item.product?.name}</span>
            </div>
            
            {item.add_ons?.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: fontSize }}>
                {item.add_ons.map((addOn, aIdx) => (
                  <div key={aIdx}>+ {addOn.name}</div>
                ))}
              </div>
            )}

            {item.notes && (
              <div style={{ marginTop: '6px', padding: '4px', backgroundColor: '#eee', fontWeight: '900', fontSize: fontSize, border: '1px solid #000' }}>
                CATATAN: {item.notes.toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: fontSize, fontWeight: 'bold' }}>
        <p>MOHON SEGERA DIPROSES</p>
      </div>
    </div>
  );
}

// ==========================================
// 3. KOMPONEN STRUK ARSIP KASIR
// ==========================================
function ArchiveReceipt({ transaction, formatRupiah, formatDate, receiptSettings, paperSize, fontSize }) {
  const businessName = receiptSettings.business_name || 'WARUNG BAKSO';
  const discAmount = parseFloat(transaction.discount_amount) || 0;

  return (
    <div style={{ lineHeight: '1.4', color: '#000' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontWeight: 'bold', fontSize: parseInt(fontSize) + 4, margin: '0 0 4px 0', textTransform: 'uppercase' }}>ARSIP KASIR</h2>
        <p style={{ margin: '2px 0', fontSize: fontSize }}>{businessName}</p>
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>No:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.invoice_number}</span>
        </div>
        
        {/* ✅ TAMBAHAN: Nama Pelanggan di Struk Arsip */}
        {transaction.customer_name && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Pelanggan:</span>
            <span style={{ fontWeight: 'bold' }}>{transaction.customer_name}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tgl:</span>
          <span>{formatDate(transaction.transacted_at || transaction.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.cashier?.name || transaction.cashier_name || '-'}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        {transaction.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.product_name || item.product?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.subtotal || (item.price * item.qty))}</span>
            </div>
          </div>
        ))}
        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: fontSize }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: parseInt(fontSize) + 2 }}>
          <span>TOTAL</span><span>{formatRupiah(transaction.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Metode:</span><span style={{ textTransform: 'capitalize' }}>{transaction.payment_method || 'Tunai'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tunai</span><span>{formatRupiah(transaction.paid)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Kembali</span><span>{formatRupiah(transaction.change)}</span></div>
      </div>

      <div style={{ marginTop: '24px', fontSize: fontSize }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span>Kasir:</span>
          <span style={{ borderBottom: '1px solid #000', width: '100px', display: 'inline-block', height: '20px' }}>&nbsp;</span>
        </div>
      </div>
    </div>
  );
}