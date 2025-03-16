using Microsoft.AspNetCore.Http;

namespace BookStoreAPI.Services
{
    public interface IImageService
    {
        Task<string> SaveImageAsync(IFormFile imageFile);
        bool DeleteImage(string imagePath);
    }
}

