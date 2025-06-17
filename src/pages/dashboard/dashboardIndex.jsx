import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';
import { fetcherDashboards } from '../../lib/fetcher';

function DashboardIndex() {
    const { data, isLoading } = useSWR('dashboards', fetcherDashboards);

    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

    if (isLoading) {
        return <>Please wait...</>
    }
    
    return (<>
        <div className="p-4 container">
            <div className='flex justify-between'>
                <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
                <h2 className="font-bold my-2">Laporan Data Sepanjang Bulan {bulan[new Date().getMonth()]} {new Date().getFullYear()}</h2>
            </div>

            <div className="flex gap-4 py-4">
                <div className="flex-1 p-8 shadow-2xl rounded-xl">
                    <h2 className="text-xl font-semibold">Total Transaksi</h2>
                    <span className="text-xl">{data.map(e => e.transaksi).reduce((acc, cur) => acc + cur, 0)}</span>
                </div>

                <div className="flex-1 p-8 shadow-2xl rounded-xl">
                    <h2 className="text-xl font-semibold">Total Pendapatan</h2>
                    <span className="text-xl">Rp{data.map(e => e.pendapatan).reduce((acc, cur) => acc + cur, 0).toLocaleString()}</span>
                </div>
            </div>
            <div className='flex gap-2'>
                <div className="flex-1 p-8 shadow-2xl rounded-xl">
                    <h2 className="text-xl font-semibold my-4">Grafik Transaksi</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <Line type="monotone" dataKey="transaksi" stroke="#8884d8" />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={e => e.toLocaleString()} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 p-8 shadow-2xl rounded-xl">
                    <h2 className="text-xl font-semibold my-4">Grafik Pendapatan</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <Line type="monotone" dataKey="pendapatan" stroke="#8884d8" />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={e => e.toLocaleString()} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>


        </div>
    </>);
}

export default DashboardIndex;