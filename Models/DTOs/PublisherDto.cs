using System.ComponentModel.DataAnnotations;

namespace BookStoreAPI.Models.DTOs
{
    public class PublisherDto
    {
        public int PublisherId { get; set; }

        [Required(ErrorMessage = "Publisher name is required")]
        [StringLength(100, ErrorMessage = "Publisher name cannot be longer than 100 characters")]
        public string Name { get; set; }

        [StringLength(200, ErrorMessage = "Address cannot be longer than 200 characters")]
        public string Address { get; set; }

        [StringLength(100, ErrorMessage = "Contact cannot be longer than 100 characters")]
        [DataType(DataType.EmailAddress)]
        public string Contact { get; set; }

    }

}
