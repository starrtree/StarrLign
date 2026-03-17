'use client';

import { useStore } from '@/lib/store';
import DocumentsListView from './DocumentsListView';
import DocumentEditor from './DocumentEditor';

export default function DocumentsView() {
  const { selectedDocumentId } = useStore();

  if (selectedDocumentId) {
    return <DocumentEditor />;
  }

  return <DocumentsListView />;
}
