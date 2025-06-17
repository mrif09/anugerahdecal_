import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../../lib/firebase";

function Invoice() {
  const { id } = useParams();
  const [transaksi, setTransaksi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaksi = async () => {
      setLoading(true);
      const docRef = doc(db, "transaksis", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTransaksi(docSnap.data());
      }
      setLoading(false);
    };
    fetchTransaksi();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!transaksi) return <div className="p-8">Data tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Invoice</h2>
      <div className="mb-2"><b>Customer:</b> {transaksi.customer}</div>
      <div className="mb-2"><b>Status Pembayaran:</b> {transaksi.status_pembayaran}</div>
      <div className="mb-2"><b>Tanggal:</b> {transaksi.date_transaction?.toDate?.().toLocaleString('en-GB')}</div>
      <div className="mb-2"><b>Produk:</b></div>
      <ul className="mb-2 list-disc pl-6">
        {transaksi.listProduct?.map((item, idx) => {
          const namaProduk = item.product?.split(',')[0] ?? '';
          const hargaProduk = Number(item.product?.split(',')[1] ?? 0);
          const hargaBahan = Number(item.bahan ?? 0);
          const hargaLaminating = Number(item.laminating ?? 0);
          const qty = Number(item.qty ?? 0);
          const hargaTotalProduk = hargaProduk + ((hargaBahan + hargaLaminating) * qty);
          return (
            <li key={idx}>
              <div>
                {namaProduk} - {qty}m (Rp{hargaTotalProduk.toLocaleString()})
              </div>
              <div className="text-sm ml-2">
                Harga Produk: Rp{hargaProduk.toLocaleString()}<br />
                Harga Bahan: Rp{hargaBahan.toLocaleString()} /m<br />
                Harga Laminasi: Rp{hargaLaminating.toLocaleString()} /m
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mb-2"><b>Total Harga:</b> Rp{transaksi.price?.toLocaleString()}</div>
    </div>
  );
}

export default Invoice;