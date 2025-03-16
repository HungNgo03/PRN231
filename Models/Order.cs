using System;
using System.Collections.Generic;

namespace BookStoreAPI.Models
{
    public partial class Order
    {
        public Order()
        {
            OrderDetails = new HashSet<OrderDetail>();
        }

        public int OrderId { get; set; }
        public int? UserId { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = null!;

        public virtual User? User { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
    }
}
