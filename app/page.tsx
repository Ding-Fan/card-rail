'use client';

import { Card } from '../components/Card';
import { getAllMockNotes } from '../data/mockNotes';

export default function Home() {
  const notes = getAllMockNotes();

  const handleCardTap = (noteId: string) => {
    console.log('Card tapped:', noteId);
    // TODO: Navigate to edit page
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vertical scrollable container */}
      <div className="h-screen overflow-y-auto ">
        {notes.map((note) => (
          <div key={note.id} className="h-screen p-4 snap-start flex-shrink-0">
            <Card 
              note={note} 
              onTap={handleCardTap}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
