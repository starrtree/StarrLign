'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import DocumentsListView from './DocumentsListView';
import DocumentEditor from './DocumentEditor';

export default function DocumentsView() {
  const { selectedDocumentId, setSelectedDocumentId } = useStore();

  useEffect(() => {
    if (!selectedDocumentId) return;
    window.history.pushState({ starrlignDoc: selectedDocumentId }, '');

    const handlePopState = () => {
      setSelectedDocumentId(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedDocumentId, setSelectedDocumentId]);

  if (selectedDocumentId) {
    return <DocumentEditor />;
  }

  return <DocumentsListView />;
}
