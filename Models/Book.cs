using System;
using System.Collections.Generic;

namespace BookStoreAPI.Models
{
    public partial class Book
    {
        public Book()
        {
            OrderDetails = new HashSet<OrderDetail>();
        }

        public int BookId { get; set; }
        public string Title { get; set; } = null!;
        public string Isbn { get; set; } = null!;
        public DateTime? PublishedDate { get; set; }
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int? CategoryId { get; set; }
        public int? PublisherId { get; set; }
        public int StockQuantity { get; set; }

        public virtual Category? Category { get; set; }
        public virtual Publisher? Publisher { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
    }
}
