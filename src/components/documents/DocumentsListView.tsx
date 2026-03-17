'use client';

import { useStore, formatRelativeTime, calculateWordCount } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Plus, FileText } from 'lucide-react';

export default function DocumentsListView() {
  const { documents, projects, setSelectedDocumentId, createDocument } = useStore();

  const unarchivedDocs = documents.filter(d => !d.isArchived);

  const handleCreateDocument = () => {
    createDocument();
  };

  const handleOpenDocument = (docId: string) => {
    setSelectedDocumentId(docId);
  };

  const colorMap: Record<string, string> = {
    red: 'var(--brand-red)',
    blue: 'var(--brand-blue)',
    yellow: 'var(--brand-yellow)',
    gray: 'var(--gray-400)',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
  };

  const getProjectInfo = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId && !p.isArchived);
  };

  const getPreviewText = (blocks: typeof documents[0]['blocks']): string => {
    const textBlock = blocks.find(b => b.type === 'text' && b.content.trim());
    if (textBlock) {
      return textBlock.content.slice(0, 80) + (textBlock.content.length > 80 ? '...' : '');
    }
    return 'No preview available...';
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          DOCUMENTS
        </h1>
        <button
          onClick={handleCreateDocument}
          className="flex items-center gap-1.5 px-4 py-2 bg-transparent text-[var(--gray-600)] text-xs font-bold border-[2px] border-black rounded-lg cursor-pointer transition-all duration-150 hover:bg-[var(--brand-yellow)] hover:text-black shadow-[2px_2px_0_black] hover:shadow-[3px_3px_0_black] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          <Plus className="w-3.5 h-3.5" /> New Document
        </button>
      </div>

      {/* Documents Grid */}
      {unarchivedDocs.length === 0 ? (
        <div className="bg-white border-[2px] border-black rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-4" />
          <p className="text-[var(--gray-400)] text-sm" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            No documents yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unarchivedDocs.map((doc) => {
            const project = getProjectInfo(doc.projectId);
            const wordCount = calculateWordCount(doc.blocks);
            const preview = getPreviewText(doc.blocks);

            return (
              <div
                key={doc.id}
                onClick={() => handleOpenDocument(doc.id)}
                className="group bg-white border-[2px] border-black rounded-lg cursor-pointer transition-all duration-200 hover:border-[var(--brand-blue)] hover:shadow-[4px_4px_0_black] hover:translate-y-[-2px] overflow-hidden"
              >
                {/* Project color top border */}
                <div 
                  className="h-1 transition-colors"
                  style={{ backgroundColor: project ? colorMap[project.color] : 'var(--gray-200)' }}
                />

                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-[15px] mb-2 text-black group-hover:text-[var(--brand-blue)] transition-colors">
                    {doc.title || 'Untitled Document'}
                  </h3>

                  {/* Project & Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    {project && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colorMap[project.color] }}
                        />
                        <span className="text-[10px] text-[var(--gray-500)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                          {project.name}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-[var(--gray-400)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                      {formatRelativeTime(doc.updatedAt)}
                    </span>
                    <span className="text-[10px] text-[var(--gray-400)]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                      {wordCount} words
                    </span>
                  </div>

                  {/* Preview */}
                  <p className="text-xs text-[var(--gray-500)] line-clamp-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {preview}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

