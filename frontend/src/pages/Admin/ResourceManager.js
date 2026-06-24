import React, { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Search, Plus, Trash2, Eye, FileText, X, Upload,
  Tag, Calendar, AlertTriangle, BookOpen
} from 'lucide-react';

// Base URL cho backend (bỏ /api nếu có)
const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const ResourceManager = () => {
  const [resources, setResources] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state cho thêm tài liệu mới
  const [form, setForm] = useState({
    title: '',
    tagId: '',
    file: null
  });

  // Lấy danh sách tài liệu
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : '';
      const data = await axiosClient.get(`/resources${params}`);
      setResources(data || []);
    } catch (err) {
      console.error('Lỗi lấy tài liệu:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Lấy danh sách tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagData = await axiosClient.get('/tags');
        setTags(tagData || []);
      } catch (err) {
        console.error('Lỗi lấy tags:', err);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  // Mở PDF trong tab mới
  const openDocument = (contentURL) => {
    if (contentURL) {
      window.open(`${BACKEND_URL}${contentURL}`, '_blank');
    }
  };

  // Xóa tài liệu
  const handleDelete = async (resourceId) => {
    try {
      await axiosClient.delete(`/resources/${resourceId}`);
      setDeleteConfirm(null);
      fetchResources();
    } catch (err) {
      console.error('Lỗi xóa tài liệu:', err);
      alert('Xóa tài liệu thất bại. Vui lòng thử lại.');
    }
  };

  // Thêm tài liệu mới
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu');
      return;
    }
    if (!form.tagId) {
      alert('Vui lòng chọn tag cho tài liệu');
      return;
    }
    if (!form.file) {
      alert('Vui lòng chọn file PDF để upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('tagId', form.tagId);
      formData.append('file', form.file);

      // Dùng axios trực tiếp vì cần gửi multipart/form-data
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/resources`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Lỗi upload');
      }

      setIsModalOpen(false);
      setForm({ title: '', tagId: '', file: null });
      fetchResources();
    } catch (err) {
      console.error('Lỗi thêm tài liệu:', err);
      alert(err.message || 'Thêm tài liệu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header + Search - Sticky */}
      <div className="sticky top-0 z-10 bg-white pb-4 -mx-6 px-6 pt-0 border-b border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Kho tài liệu ôn tập</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Quản lý {resources.length} tài liệu ôn tập
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setForm({ title: '', tagId: '', file: null });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            <Plus size={18} />
            Thêm tài liệu mới
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên tài liệu hoặc tag..."
              className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 transition font-medium"
          >
            <Search size={16} className="mr-1.5" />
            Tìm
          </button>
        </form>
      </div>

      {/* Danh sách tài liệu */}
      <div className="pt-4">
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p>Đang tải tài liệu...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Không tìm thấy tài liệu nào</p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu bằng cách thêm tài liệu mới'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên tài liệu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tag</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resources.map((resource, index) => (
                  <tr
                    key={resource.ResourceID}
                    className="hover:bg-indigo-50/50 transition group"
                  >
                    <td className="px-4 py-3.5 text-sm text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">
                            {resource.Title}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                            {resource.ContentURL}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        <Tag size={12} />
                        {resource.TagName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {formatDate(resource.CreatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDocument(resource.ContentURL)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                          title="Xem tài liệu"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(resource)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition"
                          title="Xóa tài liệu"
                        >
                          <Trash2 size={16} />
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

      {/* Modal: Thêm tài liệu mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Upload size={18} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Thêm tài liệu mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tiêu đề tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Tài liệu ôn tập - Thì hiện tại đơn"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Chọn Tag */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Chọn Tag liên quan <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.tagId}
                  onChange={(e) => setForm(prev => ({ ...prev, tagId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                >
                  <option value="">-- Chọn tag --</option>
                  {tags.map(tag => (
                    <option key={tag.TagID} value={tag.TagID}>
                      {tag.TagName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload file */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  File PDF <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setForm(prev => ({ ...prev, file: e.target.files[0] || null }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-medium file:text-sm file:cursor-pointer hover:file:bg-indigo-200"
                    required
                  />
                </div>
                {form.file && (
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                    <FileText size={12} />
                    {form.file.name} ({(form.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-medium transition shadow-sm ${isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang tải lên...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload size={16} />
                      Tải lên
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa</h3>
              <p className="text-sm text-gray-600 mb-1">Bạn có chắc chắn muốn xóa tài liệu:</p>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                "{deleteConfirm.Title}"
              </p>
              <p className="text-xs text-red-500 mb-5">
                ⚠️ Hành động này không thể hoàn tác. File PDF cũng sẽ bị xóa.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.ResourceID)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Trash2 size={15} />
                    Xóa
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
