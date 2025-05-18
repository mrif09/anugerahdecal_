function Table({rows=[], children}) {
    return ( <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                {rows.map(item => 
                                <th key={item} className="p-4 text-left">{item}</th>
                                )} 
                            </tr>
                        </thead>
                        <tbody>
                            {children}
                        </tbody>
                    </table>
                </div> );
}

export default Table;