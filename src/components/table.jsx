function Table({ rows = [], children }) {
    return (<div className="overflow-x-auto">
        <table className="min-w-full bg-white">
            <thead>
                <tr>
                    {rows.map((row, idx) => (
                        <th
                            key={idx}
                            className="border border-black bg-blue-500 text-white px-2 py-3 text-center font-semibold"
                        >
                            {row}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>);
}

export default Table;