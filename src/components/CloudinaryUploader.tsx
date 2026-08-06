

"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Loader2,  Upload, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";

type ImageUploadProps = {
  onChange: (urls: string[]) => void;
  value: string[];
  maxFiles?: number;
  className?: string;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowReorder?: boolean;
};

const ImageUpload = ({ 
  onChange, 
  value, 
  maxFiles = 10, 
  className = "",
  allowEdit = true,
  allowDelete = true,

}: ImageUploadProps) => {
  const [imageUrls, setImageUrls] = useState<string[]>(value || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUploadComplete = useCallback((res: any[]) => {
    const urls = res.map((file) => file.url);
    
    if (editingIndex !== null) {
      // Replace existing image
      const newUrls = [...imageUrls];
      newUrls[editingIndex] = urls[0]; // Replace with new image
      setImageUrls(newUrls);
      onChange(newUrls);
      setEditingIndex(null);
    } else {
      // Add new images
      const newUrls = [...imageUrls, ...urls];
      setImageUrls(newUrls);
      onChange(newUrls);
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  }, [imageUrls, onChange, editingIndex]);

  const handleUploadError = useCallback((error: Error) => {
    console.error("Upload error:", error);
    setIsUploading(false);
    setUploadProgress(0);
    setEditingIndex(null);
    alert(`Upload failed: ${error.message}`);
  }, []);

  const handleUploadBegin = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
  }, []);

  const removeImage = useCallback((index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    onChange(newUrls);
    setEditingIndex(null);
  }, [imageUrls, onChange]);

  const startEditImage = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  const canUploadMore = useMemo(() => {
    return imageUrls.length < maxFiles;
  }, [imageUrls.length, maxFiles]);

  const isEditing = editingIndex !== null;

  return (
    <div className={`bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 ${className}`}>
      {/* Upload Area */}
      <div className="text-center">
        {!isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? "Replace Image" : "Upload Images"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing 
                  ? "Upload a new image to replace the current one"
                  : canUploadMore 
                    ? `Upload up to ${maxFiles - imageUrls.length} more images`
                    : "Maximum number of images reached"
                }
              </p>
            </div>
            
            {(canUploadMore || isEditing) && (
              <div className="space-y-2">
                <UploadButton
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  endpoint="imageUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  onUploadBegin={handleUploadBegin}
                  config={{
                    mode: "auto",
                    appendOnPaste: true,
                  }}
                />
                {isEditing && (
                  <button
                    onClick={cancelEdit}
                    className="block mx-auto text-sm text-gray-500 hover:text-gray-700 mt-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? "Replacing Image..." : "Uploading..."}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Please wait while your image is being processed</p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#e6dfd9] rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Images Grid */}
      {imageUrls.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {isEditing ? "Current Images" : "Uploaded Images"} ({imageUrls.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className={`aspect-square rounded-lg overflow-hidden bg-[#e6dfd9] ${
                  editingIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                
                {/* Image Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {allowEdit && editingIndex !== index && (
                    <button
                      onClick={() => startEditImage(index)}
                      className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                      title="Replace image"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {allowDelete && (
                    <button
                      onClick={() => removeImage(index)}
                      className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Main Image Indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Main
                  </div>
                )}

                {/* Editing Indicator */}
                {editingIndex === index && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      Replacing...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {imageUrls.length === 0 && !isUploading && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
