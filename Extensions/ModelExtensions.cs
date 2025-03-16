using BookStoreAPI.Models;

namespace BookStoreAPI.Extensions
{
    public static class ModelExtensions
    {
        public static Book SanitizeNullValues(this Book book)
        {
            if (book == null) return null;

            book.Description ??= string.Empty;
            book.ImageUrl ??= string.Empty;

            if (book.Category != null)
            {
                book.Category.Description ??= string.Empty;
            }

            if (book.Publisher != null)
            {
                book.Publisher.Address ??= string.Empty;
                book.Publisher.Contact ??= string.Empty;
            }

            return book;
        }

        public static Category SanitizeNullValues(this Category category)
        {
            if (category == null) return null;

            category.Description ??= string.Empty;

            if (category.Books != null)
            {
                foreach (var book in category.Books)
                {
                    book.SanitizeNullValues();
                }
            }

            return category;
        }

        public static Publisher SanitizeNullValues(this Publisher publisher)
        {
            if (publisher == null) return null;

            publisher.Address ??= string.Empty;
            publisher.Contact ??= string.Empty;

            if (publisher.Books != null)
            {
                foreach (var book in publisher.Books)
                {
                    book.SanitizeNullValues();
                }
            }

            return publisher;
        }
    }
}

