#!/usr/bin/env python3
"""
Script to update gallery image sections in admin-dashboard.tsx
Adds "From URL" feature to both create and edit post forms
"""

def main():
    file_path = '/Users/melvinperalta/Downloads/WiredLiving-main/components/admin-dashboard.tsx'
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # The replacement HTML for the file input section
    new_gallery_input = '''                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingGallery}
                      onChange={(e) => handleGalleryUpload(e.target.files)}
                      className="flex-1 block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
                      className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 whitespace-nowrap"
                    >
                      {showGalleryUrlInput ? '✕ Cancel' : '🔗 From URL'}
                    </button>
                  </div>
                  {showGalleryUrlInput && (
                    <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Add images from Giphy, Tenor, or direct image URLs
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={galleryUrlValue}
                          onChange={(e) => setGalleryUrlValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleGalleryUrlAdd(galleryUrlValue);
                              setGalleryUrlValue('');
                              setShowGalleryUrlInput(false);
                            }
                          }}
                          placeholder="https://media.giphy.com/... or https://tenor.com/..."
                          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleGalleryUrlAdd(galleryUrlValue);
                            setGalleryUrlValue('');
                            setShowGalleryUrlInput(false);
                          }}
                          disabled={!galleryUrlValue.trim()}
                          className="px-3 py-2 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Add Image
                        </button>
                      </div>
                    </div>
                  )}
'''
    
    # Pattern to match - the single file input element
    old_pattern = '                  <input\n                    type="file"\n                    accept="image/*"\n                    multiple\n                    disabled={uploadingGallery}\n                    onChange={(e) => handleGalleryUpload(e.target.files)}\n                    className="block w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"\n                  />\n'
    
    # Convert file to string for easier manipulation
    content = ''.join(lines)
    
    # Count occurrences
    count = content.count(old_pattern)
    print(f"Found {count} occurrences of the pattern")
    
    if count != 2:
        print(f"Warning: Expected 2 occurrences, found {count}")
        print("Searching for the pattern...")
        
        # Let's try to find similar patterns
        for i, line in enumerate(lines, 1):
            if 'handleGalleryUpload' in line and 'onChange' in line:
                print(f"Found handleGalleryUpload at line {i}: {line.strip()}")
    else:
        # Replace all occurrences
        updated_content = content.replace(old_pattern, new_gallery_input)
        
        # Write back
        with open(file_path, 'w') as f:
            f.write(updated_content)
        
        print("✅ Successfully updated both gallery sections!")
        print("Updated:")
        print("  - Create post form gallery section")
        print("  - Edit post form gallery section")

if __name__ == '__main__':
    main()
