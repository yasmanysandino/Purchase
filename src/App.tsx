import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

type Supplier = {
  number: string;
  name: string;
};

type Warehouse = {
  site: string;
  loc: string;
};

type TransferLine = {
  from: string;
  to: string;
  item: string;
  qty: string;
};

type PurchaseLine = {
  wh: string;
  item: string;
  qty: string;
};

const warehouses: Warehouse[] = [
  { site: '010', loc: 'MCL' },
  { site: '020', loc: 'HAR' },
  { site: '030', loc: 'LAR' },
  { site: '050', loc: 'CC' },
  { site: '060', loc: 'EP' },
  { site: '070', loc: 'RSW' },
  { site: '801', loc: 'CORP' },
  { site: '880', loc: 'ALBQ' },
  { site: '883', loc: 'AUS' },
  { site: '884', loc: 'HOU' },
  { site: '885', loc: 'DAL' },
];

const formatWH = (w: Warehouse) => `${w.loc} (${w.site})`;

export default function App() {
  const [supplier, setSupplier] = useState<Supplier>(() => {
    const data = localStorage.getItem('supplier');
    return data ? JSON.parse(data) : { number: '', name: '' };
  });

  const [transfers, setTransfers] = useState<TransferLine[]>(() => {
    const data = localStorage.getItem('transfers');
    return data ? JSON.parse(data) : [];
  });

  const [purchase, setPurchase] = useState<PurchaseLine[]>(() => {
    const data = localStorage.getItem('purchase');
    return data ? JSON.parse(data) : [];
  });

  useEffect(() => {
    localStorage.setItem('supplier', JSON.stringify(supplier));
  }, [supplier]);

  useEffect(() => {
    localStorage.setItem('transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('purchase', JSON.stringify(purchase));
  }, [purchase]);

  const addTransfer = () => {
    setTransfers([...transfers, { from: '', to: '', item: '', qty: '' }]);
  };

  const addPurchase = () => {
    setPurchase([...purchase, { wh: '', item: '', qty: '' }]);
  };

  const updateTransfer = (
    index: number,
    field: keyof TransferLine,
    value: string
  ) => {
    const updated = [...transfers];
    updated[index][field] = value;
    setTransfers(updated);
  };

  const updatePurchase = (
    index: number,
    field: keyof PurchaseLine,
    value: string
  ) => {
    const updated = [...purchase];
    updated[index][field] = value;
    setPurchase(updated);
  };

  const clearAll = () => {
    if (!confirm('Are you sure you want to clear all data?')) return;

    setSupplier({ number: '', name: '' });
    setTransfers([]);
    setPurchase([]);

    localStorage.removeItem('supplier');
    localStorage.removeItem('transfers');
    localStorage.removeItem('purchase');
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(transfers),
      'Transfers'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(purchase),
      'Purchase'
    );

    XLSX.writeFile(wb, `Order_${supplier.name || 'Supplier'}.xlsx`);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString();

      // HEADER
      doc.setFillColor(64, 64, 70);
      doc.rect(0, 0, 210, 34, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('L&F DISTRIBUTORS', 10, 14);

      doc.setFontSize(16);
      doc.text('PURCHASE & TRANSFER REQUEST', 92, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${today}`, 160, 23);

      // RED BAR
      doc.setFillColor(220, 53, 69);
      doc.rect(0, 34, 210, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.text('Purchase Optimization System', 10, 39);

      // SUPPLIER INFO
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Supplier Information', 10, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Supplier Number: ${supplier.number || '-'}`, 10, 60);
      doc.text(`Supplier Name: ${supplier.name || '-'}`, 90, 60);

      let y = 75;

      // =========================
      // TRANSFERS ORDENADOS
      // =========================
      const sortedTransfers = [...transfers].sort((a, b) => {
        const fromCompare = a.from.localeCompare(b.from);
        if (fromCompare !== 0) return fromCompare;
        return a.to.localeCompare(b.to);
      });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSFER REQUEST', 10, y);

      autoTable(doc, {
        startY: y + 6,
        head: [['From WH', 'To WH', 'Item #', 'Qty']],
        body: sortedTransfers.map((t) => [
          t.from || '-',
          t.to || '-',
          t.item || '-',
          t.qty || '-',
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [46, 134, 193],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [50, 50, 50],
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        styles: {
          cellPadding: 3,
          lineWidth: 0,
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 55 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      // =========================
      // PURCHASE ORDENADO POR WH
      // =========================
      const sortedPurchase = [...purchase].sort((a, b) =>
        a.wh.localeCompare(b.wh)
      );

      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('PURCHASE ORDER', 10, y);

      autoTable(doc, {
        startY: y + 6,
        head: [['WH', 'Item #', 'Qty to Buy']],
        body: sortedPurchase.map((p) => [
          p.wh || '-',
          p.item || '-',
          p.qty || '-',
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [6, 27, 51],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [50, 50, 50],
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        styles: {
          cellPadding: 3,
          lineWidth: 0,
        },
      });

      // FOOTER
      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Generated by L&F Distributors Purchase Optimization System | Page ${i} of ${pageCount}`,
          10,
          290
        );
      }

      doc.save(`Purchase_Transfer_${supplier.name || 'Supplier'}.pdf`);
    } catch (error) {
      console.error('PDF ERROR:', error);
      alert('PDF error. Check browser console.');
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Purchase & Transfer Request Generator</h1>

        <div className="header-actions">
          <button className="btn-green" onClick={exportExcel}>
            Export Excel
          </button>

          <button className="btn-red" onClick={exportPDF}>
            Export PDF
          </button>

          <button className="btn-dark" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      <div className="main">
        <div>
          <section className="card">
            <h2>Supplier Information</h2>

            <div className="supplier-grid">
              <div>
                <label>Supplier Number</label>
                <input
                  placeholder="Supplier Number"
                  value={supplier.number}
                  onChange={(e) =>
                    setSupplier({ ...supplier, number: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Supplier Name</label>
                <input
                  placeholder="Supplier Name"
                  value={supplier.name}
                  onChange={(e) =>
                    setSupplier({ ...supplier, name: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-title">
              <h2>Transfer Request</h2>
              <button className="btn-blue" onClick={addTransfer}>
                + Add Transfer
              </button>
            </div>

            <div className="table-header">
              <span>FROM WH</span>
              <span>TO WH</span>
              <span>ITEM #</span>
              <span>QTY</span>
              <span>ACTION</span>
            </div>

            {transfers.map((t, i) => (
              <div className="row" key={i}>
                <select
                  value={t.from}
                  onChange={(e) => updateTransfer(i, 'from', e.target.value)}
                >
                  <option value="">Select WH</option>
                  {warehouses.map((w) => (
                    <option key={w.site} value={formatWH(w)}>
                      {formatWH(w)}
                    </option>
                  ))}
                </select>

                <select
                  value={t.to}
                  onChange={(e) => updateTransfer(i, 'to', e.target.value)}
                >
                  <option value="">Select WH</option>
                  {warehouses.map((w) => (
                    <option key={w.site} value={formatWH(w)}>
                      {formatWH(w)}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Item #"
                  value={t.item}
                  onChange={(e) => updateTransfer(i, 'item', e.target.value)}
                />

                <input
                  placeholder="Qty"
                  value={t.qty}
                  onChange={(e) => updateTransfer(i, 'qty', e.target.value)}
                />

                <button
                  className="btn-red"
                  onClick={() =>
                    setTransfers(transfers.filter((_, index) => index !== i))
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </section>

          <section className="card purchase">
            <div className="section-title">
              <h2>Purchase Order</h2>
              <button className="btn-blue" onClick={addPurchase}>
                + Add Purchase
              </button>
            </div>

            <div className="table-header">
              <span>WH</span>
              <span>ITEM #</span>
              <span>QTY TO BUY</span>
              <span>ACTION</span>
            </div>

            {purchase.map((p, i) => (
              <div className="row" key={i}>
                <select
                  value={p.wh}
                  onChange={(e) => updatePurchase(i, 'wh', e.target.value)}
                >
                  <option value="">Select WH</option>
                  {warehouses.map((w) => (
                    <option key={w.site} value={formatWH(w)}>
                      {formatWH(w)}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Item #"
                  value={p.item}
                  onChange={(e) => updatePurchase(i, 'item', e.target.value)}
                />

                <input
                  placeholder="Qty"
                  value={p.qty}
                  onChange={(e) => updatePurchase(i, 'qty', e.target.value)}
                />

                <button
                  className="btn-red"
                  onClick={() =>
                    setPurchase(purchase.filter((_, index) => index !== i))
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </section>
        </div>

        <aside className="side-card">
          <h2>Warehouse List</h2>

          <table className="wh-list">
            <thead>
              <tr>
                <th>SITEID</th>
                <th>LOC</th>
              </tr>
            </thead>

            <tbody>
              {warehouses.map((w) => (
                <tr key={w.site}>
                  <td>{w.site}</td>
                  <td>{w.loc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="format-box">Format: MCL (010)</div>
        </aside>
      </div>
    </div>
  );
}
