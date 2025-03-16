using System;
using System.Collections.Generic;

namespace BookStoreAPI.Models
{
    public partial class Publisher
    {
        public Publisher()
        {
            Books = new HashSet<Book>();
        }

        public int PublisherId { get; set; }
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public string? Contact { get; set; }

        public virtual ICollection<Book> Books { get; set; }
    }
}
