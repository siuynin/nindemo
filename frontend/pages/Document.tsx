import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateService, type Generate } from '../services/generateService';
import { openaiService, type OpenAITemplate } from '../services/openaiService';
import { Table, TableHeader, TableBody, TableRow, TableCell, Badge, Input, Button, Modal, TextArea, Select } from '../components/ui';

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

interface TemplateModalState {
  isOpen: boolean;
  template: OpenAITemplate | null;
  formData: {
    title: string;
    language: string;
    maxLength: string;
    creativity: string;
    toneOfVoice: string;
  };
}

const Document: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Set page title
  useEffect(() => {
    document.title = 'Documents - AI App';
  }, []);
  const [generates, setGenerates] = useState<Generate[]>([]);
  const [templates, setTemplates] = useState<OpenAITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-documents' | 'templates'>('templates');
  
  // Modal state
  const [templateModal, setTemplateModal] = useState<TemplateModalState>({
    isOpen: false,
    template: null,
    formData: {
      title: '',
      language: 'vi',
      maxLength: '500',
      creativity: 'balanced',
      toneOfVoice: 'professional'
    }
  });

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
  const getStatusBadgeColor = (status: string): "success" | "warning" | "error" | "primary" => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'primary';
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

  // Handle template click
  const handleTemplateClick = (template: OpenAITemplate) => {
    setTemplateModal({
      isOpen: true,
      template,
      formData: {
        title: template.title,
        language: 'vi',
        maxLength: '500',
        creativity: 'balanced',
        toneOfVoice: 'professional'
      }
    });
  };

  // Handle modal close
  const handleModalClose = () => {
    setTemplateModal({
      isOpen: false,
      template: null,
      formData: {
        title: '',
        language: 'vi',
        maxLength: '500',
        creativity: 'balanced',
        toneOfVoice: 'professional'
      }
    });
  };

  // Handle form data change
  const handleFormDataChange = (field: keyof typeof templateModal.formData, value: string) => {
    setTemplateModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  };

  // Handle form submit
  const handleFormSubmit = () => {
    // TODO: Implement form submission logic
    console.log('Form data:', templateModal.formData);
    handleModalClose();
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Documents</h1>
            <p className={`mt-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Quản lý documents và templates của bạn</p>
          </div> 
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className={`border-b ${
             theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
           }`}>
             <nav className="-mb-px flex space-x-8">
               {isAuthenticated && (
                 <button
                   onClick={() => setActiveTab('my-documents')}
                   className={`py-2 px-1 border-b-2 font-medium text-sm ${
                     activeTab === 'my-documents'
                       ? 'border-blue-500 text-blue-600'
                       : `border-transparent ${
                         theme === 'dark'
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
                       theme === 'dark'
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
            <div className={`rounded-2xl border shadow-theme-sm p-6 mb-6 ${
               theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
             }`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className={`font-semibold text-title-md ${
                     theme === 'dark' ? 'text-white' : 'text-gray-900'
                   }`}>My Documents</h3>
                  <Input
                    type="search"
                    placeholder="Tìm theo tên..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-64"
                    startIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                  />
                </div>
                <Button variant="primary" size="md">
                  Create New
                </Button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={`block font-medium text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Loại
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-4 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-brand-400 focus:ring-brand-100'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  >
                    <option value="">Tất cả</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-medium text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Trạng thái
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-4 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-brand-400 focus:ring-brand-100'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className={`block font-medium text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Chia sẻ
                  </label>
                  <select
                    value={filters.share}
                    onChange={(e) => setFilters({ ...filters, share: e.target.value })}
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-4 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-brand-400 focus:ring-brand-100'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  >
                    <option value="">Tất cả</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className={`overflow-hidden rounded-xl border shadow ${
              theme === 'dark' 
                ? 'border-white/[0.05] bg-white/[0.03]' 
                : 'border-gray-200 bg-white'
            }`}>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Đang tải...</p>
                </div>
              ) : generates.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Không có documents nào</p>
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    {/* Table Header */}
                    <TableHeader className={`border-b ${
                      theme === 'dark' ? 'border-white/[0.05]' : 'border-gray-100'
                    }`}>
                      <TableRow>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-left text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Document
                        </TableCell>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-left text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Loại
                        </TableCell>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-left text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Trạng thái
                        </TableCell>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-left text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Ngày tạo
                        </TableCell>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-left text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Chi phí
                        </TableCell>
                        <TableCell
                          isHeader
                          className={`px-5 py-3 font-medium text-right text-sm uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Thao tác
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className={`divide-y ${
                      theme === 'dark' ? 'divide-white/[0.05]' : 'divide-gray-100'
                    }`}>
                      {generates.map((generate) => (
                        <TableRow key={generate.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                📄
                              </div>
                              <div>
                                <span className={`block font-medium text-sm ${
                                  theme === 'dark' ? 'text-white/90' : 'text-gray-800'
                                }`}>
                                  {generate.name}
                                </span>
                                {generate.content && (
                                  <span className={`block text-sm truncate max-w-xs ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {generate.content}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={`px-4 py-3 text-start text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Badge size="sm" color="primary">
                              {generate.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`px-4 py-3 text-start text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Badge
                              size="sm"
                              color={getStatusBadgeColor(generate.status)}
                            >
                              {generate.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={`px-4 py-3 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatDate(generate.created_at)}
                          </TableCell>
                          <TableCell className={`px-4 py-3 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {generate.credit_cost} credits
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-400">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Xem"
                              >
                                👁️
                              </button>
                              <button
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Sửa"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteGenerate(generate.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>OpenAI Templates</h3>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên..."
                      value={templateFilters.search}
                      onChange={(e) => setTemplateFilters({ ...templateFilters, search: e.target.value })}
                      className={`w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark'
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
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <span className="mr-2">🏷️</span>
                  Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTemplateFilters({ ...templateFilters, filters: '' })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      templateFilters.filters === ''
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Tất Cả
                  </button>
                  {filterOptions.filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTemplateFilters({ ...templateFilters, filters: filter })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        templateFilters.filters === filter
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {templatesLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Không tìm thấy template nào
                  </p>
                </div>
              ) : (
                 templates.map((template) => (
                   <div
                     key={template.id}
                     onClick={() => handleTemplateClick(template)}
                     className={`p-6 hover:shadow-md transition-shadow cursor-pointer ${
                       theme === 'dark'
                         ? 'bg-gray-800 hover:bg-gray-750'
                         : 'bg-white hover:bg-gray-50'
                     }`}
                   >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          {template.image && (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                              style={{ backgroundColor: template.color || '#6366f1' }}
                            >
                              <div 
                                className="w-5 h-5 image-svg" 
                                dangerouslySetInnerHTML={{ __html: template.image }}
                              />
                            </div>
                          )}
                          <h4 className={`font-semibold text-lg ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {template.title}
                          </h4>
                        </div>
                        <p className={`text-sm mb-3 line-clamp-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {template.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.filters && (
                          <Badge size="sm" color="light">
                            {template.filters}
                          </Badge>
                        )}
                        {template.category && (
                          <Badge size="sm" color="info">
                            {template.category}
                          </Badge>
                        )}
                      </div> 
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
       </div>

       {/* Template Modal */}
       <Modal
         isOpen={templateModal.isOpen}
         onClose={handleModalClose}
         title={templateModal.template?.title || 'Template'}
         size="lg"
       >
         <div className="p-6 space-y-6">
           {/* Title */}
           <div>
             <TextArea
               label="Title"
               value={templateModal.formData.title}
               onChange={(e) => handleFormDataChange('title', e.target.value)}
               rows={3}
               placeholder="Nhập tiêu đề..."
             />
           </div>

           {/* Form Fields in 2 columns */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Language */}
             <div>
               <Select
                 label="Language"
                 value={templateModal.formData.language}
                 onChange={(value) => handleFormDataChange('language', value)}
                 options={[
                   { value: "vi", label: "Tiếng Việt" },
                   { value: "en", label: "English" },
                   { value: "zh", label: "中文" },
                   { value: "ja", label: "日本語" },
                   { value: "ko", label: "한국어" },
                   { value: "fr", label: "Français" },
                   { value: "de", label: "Deutsch" },
                   { value: "es", label: "Español" }
                 ]}
               />
             </div>

             {/* Maximum Length */}
             <div>
               <Select
                 label="Maximum Length"
                 value={templateModal.formData.maxLength}
                 onChange={(value) => handleFormDataChange('maxLength', value)}
                 options={[
                   { value: "100", label: "100 từ" },
                   { value: "250", label: "250 từ" },
                   { value: "500", label: "500 từ" },
                   { value: "1000", label: "1000 từ" },
                   { value: "2000", label: "2000 từ" },
                   { value: "unlimited", label: "Không giới hạn" }
                 ]}
               />
             </div>

             {/* Creativity */}
             <div>
               <Select
                 label="Creativity"
                 value={templateModal.formData.creativity}
                 onChange={(value) => handleFormDataChange('creativity', value)}
                 options={[
                   { value: "low", label: "Thấp - Tập trung vào độ chính xác" },
                   { value: "balanced", label: "Cân bằng - Kết hợp chính xác và sáng tạo" },
                   { value: "high", label: "Cao - Tối đa hóa sự sáng tạo" }
                 ]}
               />
             </div>

             {/* Tone of Voice */}
             <div>
               <Select
                 label="Tone of Voice"
                 value={templateModal.formData.toneOfVoice}
                 onChange={(value) => handleFormDataChange('toneOfVoice', value)}
                 options={[
                   { value: "professional", label: "Chuyên nghiệp" },
                   { value: "friendly", label: "Thân thiện" },
                   { value: "casual", label: "Thoải mái" },
                   { value: "formal", label: "Trang trọng" },
                   { value: "enthusiastic", label: "Nhiệt tình" },
                   { value: "informative", label: "Thông tin" },
                   { value: "persuasive", label: "Thuyết phục" },
                   { value: "humorous", label: "Hài hước" }
                 ]}
               />
             </div>
           </div>

           {/* Action Buttons */}
           <div className="flex justify-end space-x-3 pt-4">
             <Button
               variant="outline"
               onClick={handleModalClose}
             >
               Hủy
             </Button>
             <Button
               variant="primary"
               onClick={handleFormSubmit}
             >
               Tạo nội dung
             </Button>
           </div>
         </div>
       </Modal>
     </div>
   );
 };

 export default Document;