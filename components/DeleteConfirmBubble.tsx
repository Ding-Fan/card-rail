'use client';

import React from 'react';

interface DeleteConfirmBubbleProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmBubble: React.FC<DeleteConfirmBubbleProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm border border-red-200 rounded-xl shadow-lg z-20 flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Note</h3>
            <p className="text-sm text-red-700 text-center mb-4">
                Are you sure you want to permanently delete this note? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};
