import React from 'react';
import NotePageWrapper from './NotePageWrapper';

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;

  return <NotePageWrapper noteId={id} />;
}
