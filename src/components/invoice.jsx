import React, { forwardRef } from "react";

const Invoice = forwardRef(({ transaksi, customer }, ref) => (
  <div ref={ref} style={{ padding: 24, background: "#fff", width: 600 }}>
    <h2>Invoice</h2>
    <p><b>Nama Customer:</b> {customer?.name}</p>
    <p><b>Tanggal:</b> {new Date(transaksi?.createdAt?.seconds * 1000).toLocaleDateString()}</p>
    <table border="1" cellPadding="8" style={{ width: "100%", marginTop: 16 }}>
      <thead>
        <tr>
          <th>Produk</th>
          <th>Qty</th>
          <th>Harga</th>
        </tr>
      </thead>
      <tbody>
        {transaksi?.listProduct?.map((item, idx) => (
          <tr key={idx}>
            <td>{item.productName}</td>
            <td>{item.qty}</td>
            <td>{item.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p style={{ marginTop: 16 }}><b>Total:</b> {transaksi?.total}</p>
  </div>
));

export default Invoice;