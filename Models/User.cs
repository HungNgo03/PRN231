using System;
using System.Collections.Generic;

namespace BookStoreAPI.Models
{
    public partial class User
    {
        public User()
        {
            Orders = new HashSet<Order>();
        }

        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Role { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public virtual ICollection<Order> Orders { get; set; }
    }
}
