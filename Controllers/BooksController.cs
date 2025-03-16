using BookStoreAPI.Models;
using BookStoreAPI.Models.DTOs;
using BookStoreAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;

namespace BookStoreAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ODataController
    {
        private readonly IBookService _bookService;
        private readonly IImageService _imageService;

        public BooksController(IBookService bookService, IImageService imageService)
        {
            _bookService = bookService;
            _imageService = imageService;
        }

        // GET: api/Books
        [HttpGet]
        [EnableQuery]
        public async Task<ActionResult<IEnumerable<Book>>> GetBooks()
        {
            try
            {
                var books = await _bookService.GetAllBooksAsync();
                return Ok(books);
            }
            catch (Exception ex)
            {
                // Log lỗi
                return StatusCode(500, new { message = "An error occurred while retrieving books", error = ex.Message });
            }
        }

        // GET: api/Books/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            try
            {
                var book = await _bookService.GetBookByIdAsync(id);

                if (book == null)
                {
                    return NotFound(new { message = $"Book with ID {id} not found" });
                }

                return Ok(book);
            }
            catch (Exception ex)
            {
                // Log lỗi
                return StatusCode(500, new { message = $"An error occurred while retrieving book with ID {id}", error = ex.Message });
            }
        }

        // POST: api/Books
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Book>> PostBook(Book book)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdBook = await _bookService.CreateBookAsync(book);
            return CreatedAtAction(nameof(GetBook), new { id = createdBook.BookId }, createdBook);
        }

        // PUT: api/Books/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutBook(int id, Book book)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedBook = await _bookService.UpdateBookAsync(id, book);
            if (updatedBook == null)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/Books/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var result = await _bookService.DeleteBookAsync(id);
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        // POST: api/Books/UploadImage
        [HttpPost("UploadImage")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadImage([FromForm] BookImageUploadDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Lấy thông tin sách
                var book = await _bookService.GetBookByIdAsync(model.BookId);
                if (book == null)
                {
                    return NotFound(new { message = $"Book with ID {model.BookId} not found" });
                }

                // Xóa ảnh cũ nếu có
                if (!string.IsNullOrEmpty(book.ImageUrl))
                {
                    _imageService.DeleteImage(book.ImageUrl);
                }

                // Lưu ảnh mới
                string imageUrl = await _imageService.SaveImageAsync(model.ImageFile);
                if (string.IsNullOrEmpty(imageUrl))
                {
                    return BadRequest(new { message = "Failed to save image" });
                }

                // Cập nhật đường dẫn ảnh trong database
                book.ImageUrl = imageUrl;
                var updatedBook = await _bookService.UpdateBookAsync(book.BookId, book);

                return Ok(new { message = "Image uploaded successfully", imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while uploading image", error = ex.Message });
            }
        }
    }
}

