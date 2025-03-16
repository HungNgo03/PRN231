using BookStoreAPI.Data;
using BookStoreAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;
using System.Text;
using BookStoreAPI.Models;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<BookStoreAPI.Models.BookStoreDBContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// Add OData support
static IEdmModel GetEdmModel()
{
    ODataConventionModelBuilder builder = new();
    builder.EntitySet<Book>("Books");
    builder.EntitySet<Category>("Categories");
    builder.EntitySet<Publisher>("Publishers");
    builder.EntitySet<Order>("Orders");

    // Cấu hình các thuộc tính có thể null
    builder.EntityType<Book>().Property(b => b.Description).IsNullable();
    builder.EntityType<Book>().Property(b => b.ImageUrl).IsNullable();
    builder.EntityType<Book>().Property(b => b.PublishedDate).IsNullable();
    builder.EntityType<Book>().Property(b => b.CategoryId).IsNullable();
    builder.EntityType<Book>().Property(b => b.PublisherId).IsNullable();

    builder.EntityType<Category>().Property(c => c.Description).IsNullable();

    builder.EntityType<Publisher>().Property(p => p.Address).IsNullable();
    builder.EntityType<Publisher>().Property(p => p.Contact).IsNullable();

    return builder.GetEdmModel();
}

// Configure controllers with OData and JSON options
builder.Services.AddControllers(options =>
{
    // Add XML formatter for content negotiation
    options.OutputFormatters.Add(new XmlSerializerOutputFormatter());
    options.FormatterMappings.SetMediaTypeMappingForFormat("xml", "application/xml");
    options.FormatterMappings.SetMediaTypeMappingForFormat("json", "application/json");
})
.AddOData(options => options
    .Select()
    .Filter()
    .OrderBy()
    .Expand()
    .Count()
    .SetMaxTop(100)
    .AddRouteComponents("odata", GetEdmModel()))
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Add services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IImageService, ImageService>();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Đảm bảo thư mục images tồn tại
var imagesDirectory = Path.Combine(app.Environment.WebRootPath, "images", "books");
if (!Directory.Exists(imagesDirectory))
{
    Directory.CreateDirectory(imagesDirectory);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

