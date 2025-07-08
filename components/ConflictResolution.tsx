'use client';

import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../lib/types';
import { conflictNotesOnlyAtom, resolveConflictAtom } from '../lib/atoms';

interface ConflictResolutionProps {
    note: Note;
    onClose: () => void;
}

const ConflictResolution: React.FC<ConflictResolutionProps> = ({ note, onClose }) => {
    const resolveConflict = useSetAtom(resolveConflictAtom);

    const handleResolve = (useLocal: boolean) => {
        resolveConflict(note.id, useLocal);
        onClose();
    };

    if (!note.conflictData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-semibold">Sync Conflict</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-gray-600 mb-4">
                        This note has been modified both locally and on the server. Choose which version to keep:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Local Version */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-50 border-b px-4 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="font-medium text-blue-800">Local Version</span>
                                </div>
                                <div className="text-sm text-blue-600 mt-1">
                                    Modified: {new Date(note.updated_at).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 max-h-96 overflow-y-auto">
                                <h3 className="font-semibold mb-2">{note.title}</h3>
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {note.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Server Version */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-green-50 border-b px-4 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="font-medium text-green-800">Server Version</span>
                                </div>
                                <div className="text-sm text-green-600 mt-1">
                                    Modified: {new Date(note.conflictData.updated_at).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 max-h-96 overflow-y-auto">
                                <h3 className="font-semibold mb-2">{note.conflictData.title}</h3>
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {note.conflictData.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleResolve(true)}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Keep Local Version
                        </button>
                        <button
                            onClick={() => handleResolve(false)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Keep Server Version
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConflictResolutionManager: React.FC = () => {
    const conflictNotes = useAtomValue(conflictNotesOnlyAtom);
    const [currentConflictIndex, setCurrentConflictIndex] = React.useState(0);

    if (conflictNotes.length === 0) return null;

    const currentNote = conflictNotes[currentConflictIndex];

    const handleClose = () => {
        if (currentConflictIndex < conflictNotes.length - 1) {
            setCurrentConflictIndex(currentConflictIndex + 1);
        } else {
            setCurrentConflictIndex(0);
        }
    };

    return (
        <ConflictResolution
            note={currentNote}
            onClose={handleClose}
        />
    );
};

export default ConflictResolution;
