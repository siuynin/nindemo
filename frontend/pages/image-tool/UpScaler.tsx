import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';

interface UpscaleRequest {
  inputImage: string;
  outputFormat: 'jpg' | 'png' | 'webp';
  upscaleFactor: 2 | 4 | 8;
}

interface UpscaleResponse {
  success: boolean;
  data?: {
    id: number;
    status: string;
    imageUrl?: string;
    credit_cost: number;
    remaining_credits: number;
  };
  error?: string;
}

const UpScaler: React.FC = () => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4 | 8>(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpscale = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    const token = authService.getToken();
    if (!token) {
      setError('Please login to use this feature');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(selectedImage);
      
      const request: UpscaleRequest = {
        inputImage: base64Image,
        outputFormat,
        upscaleFactor
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/images/upscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: UpscaleResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success && data.data?.imageUrl) {
        setResult(data.data.imageUrl);
      } else {
        throw new Error(data.error || 'Upscale failed');
      }

    } catch (err) {
      console.error('Upscale error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upscaling');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result;
      link.download = `upscaled_${upscaleFactor}x.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            AI Image Upscaler
          </h1>
          <button
            onClick={() => window.history.back()}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className={`rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Upload Image
            </h2>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedImage?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📷</div>
                  <div>
                    <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Drop your image here or click to browse
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Supports JPG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="mt-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as 'jpg' | 'png' | 'webp')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  Upscale Factor
                </label>
                <select
                  value={upscaleFactor}
                  onChange={(e) => setUpscaleFactor(Number(e.target.value) as 2 | 4 | 8)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value={2}>2x (Double Size)</option>
                  <option value={4}>4x (Quadruple Size)</option>
                  <option value={8}>8x (8 Times Larger)</option>
                </select>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleUpscale}
              disabled={!selectedImage || loading}
              className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-colors ${
                !selectedImage || loading
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Upscaling...' : 'Upscale Image'}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className={`rounded-lg shadow-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Upscaled Result
            </h2>
            
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <img
                  src={result}
                  alt="Upscaled result"
                  className="max-w-full rounded-lg shadow-md"
                />
                <button
                  onClick={downloadImage}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Download Upscaled Image
                </button>
              </div>
            )}

            {!result && !loading && (
              <div className={`flex items-center justify-center h-64 border-2 border-dashed rounded-lg ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upscaled image will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpScaler;