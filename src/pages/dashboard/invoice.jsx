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
    <div className="print-invoice max-w-2xl mx-auto mt-8 bg-white text-black p-8 rounded shadow">
      <h2 className="text-xl font-semibold mb-1">Invoice</h2>
      <div className="text-sm text-gray-500 mb-4">
        dicetak: {new Date().toLocaleString("en-CA", { hour12: false })}
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 pr-4 font-medium">Customer</td>
            <td className="py-1">{transaksi.customer}</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-medium">Status Pembayaran</td>
            <td className="py-1">
              <span className="px-2 py-1 rounded text-black text-xs font-semibold">
                {transaksi.status_pembayaran}
              </span>
            </td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-medium">Tanggal</td>
            <td className="py-1">{transaksi.date_transaction?.toDate?.().toLocaleString('en-GB')}</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-medium align-top">Produk</td>
            <td className="py-1">
              <ul className="space-y-2">
                {transaksi.listProduct?.map((item, idx) => {
                  const namaProduk = item.product?.split(',')[0] ?? '';
                  const hargaProduk = Number(item.product?.split(',')[1] ?? 0);
                  const hargaBahan = Number(item.bahan ?? 0);
                  const hargaLaminating = Number(item.laminating ?? 0);
                  const qty = Number(item.qty ?? 0);
                  const hargaTotalProduk = hargaProduk + ((hargaBahan + hargaLaminating) * qty);
                  return (
                    <li key={idx} className="bg-white rounded border-l-4 border-blue-400 p-2 text-black shadow-sm">
                      <div className="font-medium">
                        {namaProduk} <span className="text-gray-500">- {qty}m</span>
                        <span className="float-right font-semibold">Rp{hargaTotalProduk.toLocaleString()}</span>
                      </div>
                      <div className="text-xs ml-2 mt-1 text-black">
                        Harga Produk: <span>Rp{hargaProduk.toLocaleString()}</span><br />
                        Harga Bahan: <span>Rp{hargaBahan.toLocaleString()}</span> /m<br />
                        Harga Laminasi: <span>Rp{hargaLaminating.toLocaleString()}</span> /m
                      </div>
                    </li>
                  );
                })}
              </ul>
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-bold">Total Harga</td>
            <td className="py-2">
              <span className="text-base font-bold">Rp{transaksi.price?.toLocaleString()}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        onClick={() => window.print()}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
      >
        Print Invoice
      </button>
    </div>
  );
}

export default Invoice;