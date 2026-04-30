import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  const [supplier, setSupplier] = useState({
    number: "",
    name: "",
  });

  const [transfers, setTransfers] = useState([]);
  const [purchase, setPurchase] = useState([]);

  const addTransfer = () => {
    setTransfers([
      ...transfers,
      { from: "", to: "", item: "", qty: "" },
    ]);
  };

  const addPurchase = () => {
    setPurchase([
      ...purchase,
      { wh: "", item: "", qty: "" },
    ]);
  };

  const handleChange = (list, setList, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setList(updated);
  };

  // 🔹 EXPORT EXCEL
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const transferSheet = XLSX.utils.json_to_sheet(transfers);
    const purchaseSheet = XLSX.utils.json_to_sheet(purchase);

    XLSX.utils.book_append_sheet(wb, transferSheet, "Transfers");
    XLSX.utils.book_append_sheet(wb, purchaseSheet, "Purchase");

    XLSX.writeFile(wb, `Order_${supplier.name}.xlsx`);
  };

  // 🔹 EXPORT PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text(`Supplier: ${supplier.number} - ${supplier.name}`, 10, 10);

    autoTable(doc, {
      startY: 20,
      head: [["FROM", "TO", "ITEM", "QTY"]],
      body: transfers.map(t => [t.from, t.to, t.item, t.qty]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["WH", "ITEM", "QTY"]],
      body: purchase.map(p => [p.wh, p.item, p.qty]),
    });

    doc.save(`Order_${supplier.name}.pdf`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Purchase & Transfer App</h2>

      {/* SUPPLIER */}
      <div>
        <input
          placeholder="Supplier Number"
          onChange={(e) =>
            setSupplier({ ...supplier, number: e.target.value })
          }
        />
        <input
          placeholder="Supplier Name"
          onChange={(e) =>
            setSupplier({ ...supplier, name: e.target.value })
          }
        />
      </div>

      <h3>Transfers</h3>
      <button onClick={addTransfer}>+ Add Transfer</button>

      {transfers.map((t, i) => (
        <div key={i}>
          <input placeholder="From WH" onChange={(e)=>handleChange(transfers,setTransfers,i,"from",e.target.value)} />
          <input placeholder="To WH" onChange={(e)=>handleChange(transfers,setTransfers,i,"to",e.target.value)} />
          <input placeholder="Item" onChange={(e)=>handleChange(transfers,setTransfers,i,"item",e.target.value)} />
          <input placeholder="Qty" onChange={(e)=>handleChange(transfers,setTransfers,i,"qty",e.target.value)} />
        </div>
      ))}

      <h3>Purchase</h3>
      <button onClick={addPurchase}>+ Add Purchase</button>

      {purchase.map((p, i) => (
        <div key={i}>
          <input placeholder="WH" onChange={(e)=>handleChange(purchase,setPurchase,i,"wh",e.target.value)} />
          <input placeholder="Item" onChange={(e)=>handleChange(purchase,setPurchase,i,"item",e.target.value)} />
          <input placeholder="Qty" onChange={(e)=>handleChange(purchase,setPurchase,i,"qty",e.target.value)} />
        </div>
      ))}

      <br /><br />
      <button onClick={exportExcel}>Export Excel</button>
      <button onClick={exportPDF}>Export PDF</button>
    </div>
  );
}