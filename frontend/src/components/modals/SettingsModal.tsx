import React, { useState, useRef } from 'react';
import { X, User, Upload, Loader2 } from 'lucide-react';

interface UserSettings {
  name: string;
  email: string;
  image?: string | null;
}

interface SettingsModalProps {
  user: UserSettings;
  onClose: () => void;
  onUpdate: (data: { name: string; image?: string | null }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    image: user.image || null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsUpdating(true);
    setError('');
    
    try {
      await onUpdate({
        name: formData.name.trim(),
        image: formData.image,
      });
      // Modal will be closed by parent component after successful update
    } catch (error) {
      setError('Failed to update settings. Please try again.');
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-ivory rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-red-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b-2 border-red-600 flex items-center justify-between sticky top-0 bg-ivory z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Profile Image</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-red-600"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center border-2 border-red-600 ring-2 ring-red-600">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="Enter your name"
              className={`w-full px-3 md:px-4 py-2 border ${
                error && !formData.name.trim() ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                error && !formData.name.trim() ? 'focus:ring-red-500' : 'focus:ring-red-600'
              } text-sm md:text-base`}
            />
            {error && !formData.name.trim() && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          {/* Email (Fixed/Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Email</label>
            <div className="px-3 md:px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm md:text-base text-gray-600">
              {user.email}
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {error && formData.name.trim() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 md:p-5 border-t-2 border-red-600 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-ivory">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating || !formData.name.trim()}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 md:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
