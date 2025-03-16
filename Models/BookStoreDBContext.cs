using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace BookStoreAPI.Models
{
    public partial class BookStoreDBContext : DbContext
    {
        public BookStoreDBContext()
        {
        }

        public BookStoreDBContext(DbContextOptions<BookStoreDBContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Book> Books { get; set; } = null!;
        public virtual DbSet<Category> Categories { get; set; } = null!;
        public virtual DbSet<Order> Orders { get; set; } = null!;
        public virtual DbSet<OrderDetail> OrderDetails { get; set; } = null!;
        public virtual DbSet<Publisher> Publishers { get; set; } = null!;
        public virtual DbSet<User> Users { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Data Source=HUNGNGO\\SQLEXPRESS;Initial Catalog=BookStoreDB; Trusted_Connection=SSPI;Encrypt=false;TrustServerCertificate=true");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Book>(entity =>
            {
                entity.Property(e => e.ImageUrl).HasMaxLength(500);

                entity.Property(e => e.Isbn)
                    .HasMaxLength(20)
                    .HasColumnName("ISBN");

                entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");

                entity.Property(e => e.PublishedDate).HasColumnType("date");

                entity.Property(e => e.Title).HasMaxLength(200);

                entity.HasOne(d => d.Category)
                    .WithMany(p => p.Books)
                    .HasForeignKey(d => d.CategoryId)
                    .HasConstraintName("FK__Books__CategoryI__3B75D760");

                entity.HasOne(d => d.Publisher)
                    .WithMany(p => p.Books)
                    .HasForeignKey(d => d.PublisherId)
                    .HasConstraintName("FK__Books__Publisher__3C69FB99");
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.Property(e => e.Description).HasMaxLength(500);

                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(e => e.OrderDate)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Status)
                    .HasMaxLength(20)
                    .HasDefaultValueSql("('Pending')");

                entity.Property(e => e.TotalAmount).HasColumnType("decimal(10, 2)");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK__Orders__UserId__45F365D3");
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(10, 2)");

                entity.HasOne(d => d.Book)
                    .WithMany(p => p.OrderDetails)
                    .HasForeignKey(d => d.BookId)
                    .HasConstraintName("FK__OrderDeta__BookI__4BAC3F29");

                entity.HasOne(d => d.Order)
                    .WithMany(p => p.OrderDetails)
                    .HasForeignKey(d => d.OrderId)
                    .HasConstraintName("FK__OrderDeta__Order__4AB81AF0");
            });

            modelBuilder.Entity<Publisher>(entity =>
            {
                entity.Property(e => e.Address).HasMaxLength(200);

                entity.Property(e => e.Contact).HasMaxLength(100);

                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username, "UQ__Users__536C85E4B35FD583")
                    .IsUnique();

                entity.HasIndex(e => e.Email, "UQ__Users__A9D10534A7FE6E68")
                    .IsUnique();

                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Email).HasMaxLength(100);

                entity.Property(e => e.FirstName).HasMaxLength(50);

                entity.Property(e => e.LastName).HasMaxLength(50);

                entity.Property(e => e.Role)
                    .HasMaxLength(20)
                    .HasDefaultValueSql("('Customer')");

                entity.Property(e => e.Username).HasMaxLength(50);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
