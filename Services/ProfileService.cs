using BookStoreAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BookStoreAPI.Services
{
    public class ProfileService : IProfileService
    {
        private readonly Models.BookStoreDBContext _context;

        public ProfileService(Models.BookStoreDBContext context)
        {
            _context = context;
        }
        public Task<User> CreateProfileAsync(User user)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteProfileAsync(int id)
        {
            throw new NotImplementedException();
        }

        public async Task<IEnumerable<User>> GetAllProfilesAsync()
        {
            var user = await _context.Users.ToListAsync();
            if (user == null)
            {
                return null;
            }
            return user;
        }

        public Task<User> GetProfileByIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<User> UpdateProfileAsync(int id, User user)
        {
            throw new NotImplementedException();
        }
    }
}
