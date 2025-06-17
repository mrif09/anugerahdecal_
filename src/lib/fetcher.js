import { collection, getDocs, query, where } from '@firebase/firestore';
import { db } from './firebase';

const fetcher = async (path = '') => {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const fetcherProducts = () => fetcher('products')
export const fetcherMerks = () => fetcher('merks')
export const fetcherModels = () => fetcher('models')
export const fetcherKategoris = () => fetcher('kategoris')
export const fetcherBahans = () => fetcher('bahans')
export const fetcherLaminatings = () => fetcher('laminatings')
export const fetcherTransactions = () => fetcher('transaksis')
export const fetcherCustomers = () => fetcher('customers')

export const fetcherDashboards = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const querySnapshot = await getDocs(query(
        collection(db, 'transaksis'),
        where('date_transaction', '>=', startOfMonth),
        where('date_transaction', '<=', endOfMonth)
    ));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .reduce((acc, cur) => {
            const date = cur.date_transaction.toDate()
            const day = String(date.getDate()).padStart(2, '0');

            if (!acc[day]) {
                acc[day] = { day, transaksi: 0, pendapatan: 0 };
            }

            acc[day].transaksi += 1;
            acc[day].pendapatan += cur.price;

            return acc;
        }, {})
    return Object.values(data);
}