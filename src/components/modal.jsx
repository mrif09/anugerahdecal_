import { X } from "lucide-react";

function Modal({ isOpen = false, handleOpen=()=>{}, title='', children }) {
    return isOpen && (
        <div onClick={handleOpen} className="fixed inset-0 bg-[rgba(0,0,0,.7)] bg-opacity-20 flex items-center justify-center z-50">
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button
                        onClick={handleOpen}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X />
                    </button>
                </div>
            {children}
            </div>
        </div>
    );
}

export default Modal;