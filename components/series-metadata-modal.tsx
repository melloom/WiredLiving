import { useState } from 'react';
import { SeriesMetadata } from '@/types';
import { MediaUploadButton } from './media-upload-button';

interface SeriesMetadataModalProps {
  open: boolean;
  initialData?: SeriesMetadata;
  name: string;
  onClose: () => void;
  onSave: (data: Partial<SeriesMetadata> & { name: string }) => void;
}

export function SeriesMetadataModal({ open, initialData, name, onClose, onSave }: SeriesMetadataModalProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '');
  const [colorScheme, setColorScheme] = useState(initialData?.color_scheme || 'blue-purple');
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order || 0);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Edit Series: <span className="text-blue-600">{name}</span></h2>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 min-h-[60px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Series description..."
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              {coverImage && (
                <img src={coverImage} alt="cover" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
              )}
              <MediaUploadButton
                onInsert={(markdown: string) => {
                  // Extract URL from markdown (e.g., ![alt](url) or just a URL)
                  const urlMatch = markdown.match(/\(([^)]+)\)/);
                  const url = urlMatch ? urlMatch[1] : markdown.trim();
                  setCoverImage(url);
                }}
                type="image"
              />
              {coverImage && (
                <button className="ml-2 text-red-500 hover:underline text-xs" onClick={() => setCoverImage('')}>Remove</button>
              )}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Color Scheme</label>
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2"
              value={colorScheme}
              onChange={e => setColorScheme(e.target.value)}
            >
              <option value="blue-purple">Blue → Purple</option>
              <option value="purple-pink">Purple → Pink</option>
              <option value="green-emerald">Green → Emerald</option>
              <option value="orange-red">Orange → Red</option>
              <option value="indigo-purple">Indigo → Purple</option>
              <option value="teal-green">Teal → Green</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-medium">Featured</label>
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Display Order</label>
            <input
              type="number"
              className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2"
              value={displayOrder}
              onChange={e => setDisplayOrder(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            onClick={async () => {
              setSaving(true);
              await onSave({
                name,
                description,
                cover_image: coverImage,
                color_scheme: colorScheme,
                is_featured: isFeatured,
                display_order: displayOrder,
              });
              setSaving(false);
            }}
            disabled={saving}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
