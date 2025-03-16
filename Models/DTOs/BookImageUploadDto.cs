using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace BookStoreAPI.Models.DTOs
{
    public class BookImageUploadDto
    {
        [Required]
        public int BookId { get; set; }

        [Required]
        public IFormFile ImageFile { get; set; }
    }
}

