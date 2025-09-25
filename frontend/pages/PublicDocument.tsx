import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateService, type Generate } from '../services/generateService';
import { LoadingSpinner } from '../components/icons';

const PublicDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Generate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError('Document ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await generateService.getGenerate(parseInt(id));
        
        if (response.success && response.data) {
          // Check if document is public
          if (response.data.share !== 'public') {
            setError('This document is not publicly accessible');
            return;
          }
          
          setDocument(response.data);
        } else {
          setError('Document not found');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <LoadingSpinner className="w-6 h-6 text-blue-600" />
          <span className="text-gray-600">Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Document Not Available</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Document Not Found</h1>
          <p className="text-gray-600">The requested document could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{document.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Type: {document.type}</span>
            <span>•</span>
            <span>Status: {document.status}</span>
            {document.created_at && (
              <>
                <span>•</span>
                <span>Created: {new Date(document.created_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white">
          {document.content ? (
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500">This document has no content yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-500">
            This document is shared publicly. 
            <a href="/" className="text-blue-600 hover:text-blue-700 ml-1">
              Create your own documents
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicDocument;