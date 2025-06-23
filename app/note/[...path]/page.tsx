import { NoteViewClient } from './NoteViewClient';

interface NotePageProps {
  params: Promise<{
    path: string[];
  }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { path } = await params;
  
  // path array represents the nested hierarchy
  // e.g., ['parent-id'] or ['parent-id', 'child-1', 'child-2']
  
  return <NoteViewClient notePath={path} />;
}
