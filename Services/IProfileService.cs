using BookStoreAPI.Models;

namespace BookStoreAPI.Services
{
    public interface IProfileService
    {
        Task<IEnumerable<User>> GetAllProfilesAsync();
        Task<User> GetProfileByIdAsync(int id);
        Task<User> CreateProfileAsync(User user);
        Task<User> UpdateProfileAsync(int id, User user);
        Task<bool> DeleteProfileAsync(int id);
    }
}
