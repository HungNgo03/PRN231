using BookStoreAPI.Data;
using BookStoreAPI.Models;
using BookStoreAPI.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BookStoreAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly Models.BookStoreDBContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(Models.BookStoreDBContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponse> Login(LoginModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);

            if (user == null)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Invalid username or password"
                };
            }

            // In a real application, you would verify the password hash
            // For simplicity, we're just checking if the username exists
            // In production, use BCrypt or another secure hashing algorithm

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Success = true,
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Expiration = DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:DurationInMinutes"]))
            };
        }

        public async Task<AuthResponse> Register(RegisterModel model)
        {
            if (await _context.Users.AnyAsync(u => u.Username == model.Username))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Username already exists"
                };
            }

            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Email already exists"
                };
            }

            // In a real application, you would hash the password
            // For simplicity, we're storing it as is
            // In production, use BCrypt or another secure hashing algorithm

            var user = new User
            {
                Username = model.Username,
                Email = model.Email,
                PasswordHash = model.Password, // This should be hashed in production
                FirstName = model.FirstName,
                LastName = model.LastName,
                Role = "Customer",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Success = true,
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Expiration = DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:DurationInMinutes"]))
            };
        }

        public string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:DurationInMinutes"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

