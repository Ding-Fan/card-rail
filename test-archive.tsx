import React from 'react';
import { Card } from '../components/Card';
import { mockNotes } from '../test/mocks';

export default function ArchiveTestPage() {
    const handleArchived = () => {
        console.log('Note was archived!');
    };

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Archive Test Page</h1>
            <div className="max-w-md">
                <Card
                    note={mockNotes.simple}
                    onArchived={handleArchived}
                    disableEntryAnimation={true}
                />
            </div>
        </div>
    );
}
