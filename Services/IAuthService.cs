using BookStoreAPI.Models;
using BookStoreAPI.Models.DTOs;

namespace BookStoreAPI.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> Login(LoginModel model);
        Task<AuthResponse> Register(RegisterModel model);
        string GenerateJwtToken(User user);
    }
}

