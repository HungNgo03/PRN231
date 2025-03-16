using Microsoft.AspNetCore.Http;

namespace BookStoreAPI.Services
{
    public class ImageService : IImageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly string _imageDirectory;

        public ImageService(IWebHostEnvironment environment)
        {
            _environment = environment;
            _imageDirectory = Path.Combine(_environment.WebRootPath, "images", "books");
        }

        public async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return null;
            }

            // Tạo tên file duy nhất để tránh trùng lặp
            string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(imageFile.FileName)}";
            string filePath = Path.Combine(_imageDirectory, uniqueFileName);

            // Đảm bảo thư mục tồn tại
            Directory.CreateDirectory(_imageDirectory);

            // Lưu file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            // Trả về đường dẫn tương đối để lưu vào database
            return $"/images/books/{uniqueFileName}";
        }

        public bool DeleteImage(string imagePath)
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                return false;
            }

            // Lấy tên file từ đường dẫn
            string fileName = Path.GetFileName(imagePath);
            string fullPath = Path.Combine(_imageDirectory, fileName);

            // Kiểm tra file tồn tại
            if (!File.Exists(fullPath))
            {
                return false;
            }

            // Xóa file
            try
            {
                File.Delete(fullPath);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}

