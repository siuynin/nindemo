import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateService, type Generate } from '../services/generateService';
import { openaiService, type OpenAITemplate } from '../services/openaiService';
// import { toast } from 'react-toastify';
// import { FiEdit, FiTrash2, FiSearch, FiFilter, FiPlus, FiEye } from 'react-icons/fi';

interface FilterState {
  search: string;
  type: string;
  status: string;
  share: string;
}

interface TemplateFilterState {
  search: string;
  filters: string;
}

const Document: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();

  // Set page title
  useEffect(() => {
    document.title = 'Documents - AI App';
  }, []);
  const [generates, setGenerates] = useState<Generate[]>([]);
  const [templates, setTemplates] = useState<OpenAITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-documents' | 'templates'>('templates');
  
  // My Documents filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    status: '',
    share: ''
  });
  
  // Templates filters
  const [templateFilters, setTemplateFilters] = useState<TemplateFilterState>({
    search: '',
    filters: ''
  });
  
  const [filterOptions, setFilterOptions] = useState<{
    filters: string[];
    categories: string[];
    models: string[];
  }>({ filters: [], categories: [], models: [] });

  // Fetch user's generates
  const fetchGenerates = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await generateService.getGenerates({
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        share: filters.share || undefined,
        per_page: 20
      });
      
      if (response.success) {
        setGenerates(response.data);
      }
    } catch (error) {
      console.error('Error fetching generates:', error);
      alert('Không thể tải danh sách documents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch OpenAI templates
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await openaiService.getTemplates({
        search: templateFilters.search || undefined,
        filters: templateFilters.filters || undefined,
        active: true,
        per_page: 50
      });
      
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Không thể tải danh sách templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Fetch filter options for templates
  const fetchFilterOptions = async () => {
    try {
      const response = await openaiService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Delete generate
  const handleDeleteGenerate = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa document này?')) return;
    
    try {
      const response = await generateService.deleteGenerate(id);
      if (response.success) {
        alert('Xóa document thành công');
        fetchGenerates();
      }
    } catch (error) {
      console.error('Error deleting generate:', error);
      alert('Không thể xóa document');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'my-documents') {
      fetchGenerates();
    }
  }, [isAuthenticated, filters, activeTab]);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [templateFilters, activeTab]);

  // Load templates and filter options on component mount
  useEffect(() => {
    fetchTemplates();
    fetchFilterOptions();
  }, []);

  // Fetch templates when filters change
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [templateFilters.search, templateFilters.filters, activeTab]);



  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Documents</h1>
            <p className={`mt-2 ${
              actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Quản lý documents và templates của bạn</p>
          </div> 
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className={`border-b ${
             actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
           }`}>
             <nav className="-mb-px flex space-x-8">
               {isAuthenticated && (
                 <button
                   onClick={() => setActiveTab('my-documents')}
                   className={`py-2 px-1 border-b-2 font-medium text-sm ${
                     activeTab === 'my-documents'
                       ? 'border-blue-500 text-blue-600'
                       : `border-transparent ${
                         actualTheme === 'dark'
                           ? 'text-gray-400 hover:text-gray-200 hover:border-gray-600'
                           : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                       }`
                   }`}
                 >
                   My Documents
                 </button>
               )}
               <button
                 onClick={() => setActiveTab('templates')}
                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
                   activeTab === 'templates'
                     ? 'border-blue-500 text-blue-600'
                     : `border-transparent ${
                       actualTheme === 'dark'
                         ? 'text-gray-400 hover:text-gray-200 hover:border-gray-600'
                         : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`
                 }`}
               >
                 OpenAI Templates
               </button>
             </nav>
           </div>
        </div>

        {/* My Documents Tab */}
        {isAuthenticated && activeTab === 'my-documents' && (
          <div>
            {/* Header with Search */}
            <div className={`p-6 rounded-lg shadow mb-6 ${
               actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
             }`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className={`text-lg font-semibold ${
                     actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                   }`}>My Documents</h3>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Create New
                </button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-700'} mb-2`}>
                    Loại
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className={`w-full px-3 py-2 border border-${actualTheme === 'dark' ? 'gray-600' : 'gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Tất cả</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-700'} mb-2`}>
                    Trạng thái
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={`w-full px-3 py-2 border border-${actualTheme === 'dark' ? 'gray-600' : 'gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-700'} mb-2`}>
                    Chia sẻ
                  </label>
                  <select
                    value={filters.share}
                    onChange={(e) => setFilters({ ...filters, share: e.target.value })}
                    className={`w-full px-3 py-2 border border-${actualTheme === 'dark' ? 'gray-600' : 'gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Tất cả</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className={`rounded-lg shadow ${
               actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
             }`}>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
              ) : generates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Không có documents nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y divide-${actualTheme === 'dark' ? 'gray-700' : 'gray-200'}`}>
                    <thead className={`bg-${actualTheme === 'dark' ? 'gray-700' : 'gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Tên
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Loại
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Trạng thái
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Ngày tạo
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Chi phí
                        </th>
                        <th className={`px-6 py-3 text-right text-xs font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'} uppercase tracking-wider`}>
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`bg-${actualTheme === 'dark' ? 'gray-800' : 'white'} divide-y divide-gray-200`}>
                      {generates.map((generate) => (
                        <tr key={generate.id} className={`hover:bg-${actualTheme === 'dark' ? 'gray-700' : 'gray-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-900'}`}>
                            <div className="text-sm font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-900'}">
                              {generate.name}
                            </div>
                            {generate.content && (
                              <div className={`text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-500'} truncate max-w-xs`}>
                                {generate.content}
                              </div>
                            )}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-500'}`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${actualTheme === 'dark' ? 'blue-900' : 'blue-100'} text-${actualTheme === 'dark' ? 'blue-200' : 'blue-800'}`}>
                              {generate.type}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-500'}`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(generate.status, actualTheme)}`}>
                              {generate.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-500'}`}>
                            {formatDate(generate.created_at)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-${actualTheme === 'dark' ? 'white' : 'gray-500'}`}>
                            {generate.credit_cost} credits
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-${actualTheme === 'dark' ? 'white' : 'gray-500'}`}>
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Xem"
                              >
                                <span>👁️</span>
                              </button>
                              <button
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Sửa"
                              >
                                <span>✏️</span>
                              </button>
                              <button
                                onClick={() => handleDeleteGenerate(generate.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Xóa"
                              >
                                <span>🗑️</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            {/* Header with Search */}
            <div className={`p-6 rounded-lg shadow mb-6 ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className={`text-lg font-semibold ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>OpenAI Templates</h3>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên..."
                      value={templateFilters.search}
                      onChange={(e) => setTemplateFilters({ ...templateFilters, search: e.target.value })}
                      className={`w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        actualTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="mb-4">
                <p className={`text-sm font-medium mb-3 ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <span className="mr-2">🏷️</span>
                  Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTemplateFilters({ ...templateFilters, filters: '' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      templateFilters.filters === ''
                        ? 'bg-blue-600 text-white'
                        : actualTheme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Tất cả
                  </button>
                  {filterOptions.filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTemplateFilters({ ...templateFilters, filters: filter })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        templateFilters.filters === filter
                          ? 'bg-blue-600 text-white'
                          : actualTheme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className={`mt-4 ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Đang tải templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Không có templates nào
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className={`rounded-lg shadow hover:shadow-md transition-shadow ${
                    actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className={`text-lg font-semibold truncate ${
                          actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {template.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {template.type}
                        </span>
                      </div>
                      
                      {template.description && (
                        <p className={`text-sm mb-4 line-clamp-2 ${
                          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {template.description}
                        </p>
                      )}
                        
                      
                      <div className={`mt-4 pt-4 border-t ${
                        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                          Sử dụng Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Document;