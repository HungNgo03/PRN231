using BookStoreAPI.Data;
using BookStoreAPI.Models;
using BookStoreAPI.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BookStoreAPI.Services
{
    public class BookService : IBookService
    {
        private readonly Models.BookStoreDBContext _context;

        public BookService(Models.BookStoreDBContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Book>> GetAllBooksAsync()
        {
            var books = await _context.Books
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .ToListAsync();

            // Sanitize null values
            foreach (var book in books)
            {
                book.SanitizeNullValues();
            }

            return books;
        }

        public async Task<Book> GetBookByIdAsync(int id)
        {
            var book = await _context.Books
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .FirstOrDefaultAsync(b => b.BookId == id);

            return book?.SanitizeNullValues();
        }

        public async Task<Book> CreateBookAsync(Book book)
        {
            _context.Books.Add(book);
            await _context.SaveChangesAsync();
            return book.SanitizeNullValues();
        }

        public async Task<Book> UpdateBookAsync(int id, Book book)
        {
            if (id != book.BookId)
                return null;

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await BookExistsAsync(id))
                    return null;
                throw;
            }

            return book.SanitizeNullValues();
        }

        public async Task<bool> DeleteBookAsync(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
                return false;

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> BookExistsAsync(int id)
        {
            return await _context.Books.AnyAsync(e => e.BookId == id);
        }
    }
}

