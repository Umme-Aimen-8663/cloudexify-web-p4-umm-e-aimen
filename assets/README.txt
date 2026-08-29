This project uses hotlinked Unsplash placeholder images (via image_url in the
menu_items table) instead of local asset files, so this folder is intentionally
mostly empty.

To use your own images:
1. Add your image files here (e.g. assets/biryani.jpg).
2. In admin.html -> Menu Management, edit each item and set its "Image URL"
   field to a relative path like "assets/biryani.jpg", or upload the images to
   Supabase Storage and paste the public URL instead.

Recommended image size: 800x600px, JPG or WebP, under 300KB for fast loading.
