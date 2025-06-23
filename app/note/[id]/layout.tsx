// Shared layout for all /note/[id]/* routes
export default function NoteLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="note-layout">
      {/* Common header/navigation for all note pages */}
      <div className="note-header">
        {/* Add breadcrumbs, note title, etc. */}
      </div>
      
      {/* This will render page.tsx or nested/page.tsx */}
      {children}
    </div>
  );
}
