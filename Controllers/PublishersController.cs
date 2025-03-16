using BookStoreAPI.Data;
using BookStoreAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;

namespace BookStoreAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublishersController : ControllerBase
    {
        private readonly Models.BookStoreDBContext _context;
        private readonly ILogger<PublishersController> _logger;

        public PublishersController(Models.BookStoreDBContext context, ILogger<PublishersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Publishers
        [HttpGet]
        [EnableQuery]
        public async Task<ActionResult<IEnumerable<Publisher>>> GetPublishers()
        {
            try
            {
                return await _context.Publishers.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching publishers");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Publishers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Publisher>> GetPublisher(int id)
        {
            try
            {
                var publisher = await _context.Publishers.FindAsync(id);

                if (publisher == null)
                {
                    return NotFound();
                }

                return publisher;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching publisher with id {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Publishers/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutPublisher(int id, Publisher publisher)
        {
            if (id != publisher.PublisherId)
            {
                return BadRequest();
            }

            _context.Entry(publisher).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PublisherExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating publisher with id {id}");
                return StatusCode(500, "Internal server error");
            }

            return NoContent();
        }

        // POST: api/Publishers
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Publisher>> PostPublisher(Publisher publisher)
        {
            try
            {
                _context.Publishers.Add(publisher);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetPublisher", new { id = publisher.PublisherId }, publisher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating publisher");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Publishers/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePublisher(int id)
        {
            try
            {
                var publisher = await _context.Publishers.FindAsync(id);
                if (publisher == null)
                {
                    return NotFound();
                }

                _context.Publishers.Remove(publisher);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting publisher with id {id}");
                return StatusCode(500, "Internal server error");
            }
        }

        private bool PublisherExists(int id)
        {
            return _context.Publishers.Any(e => e.PublisherId == id);
        }
    }
}

