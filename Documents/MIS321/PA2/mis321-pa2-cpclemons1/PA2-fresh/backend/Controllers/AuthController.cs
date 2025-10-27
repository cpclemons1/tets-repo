using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using System.Text.RegularExpressions;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FreelanceMusic.Services;

namespace FreelanceMusic.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly string _connectionString;
    private readonly JwtService _jwtService;

    public AuthController(IConfiguration configuration, JwtService jwtService)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=../api/database.db";
        _jwtService = jwtService;
    }

    // POST /api/auth/signup
    [HttpPost("signup")]
    public IActionResult Signup([FromBody] SignupRequest request)
    {
        try
        {
            // Validation
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, error = "Email and password are required" });
            }

            // Validate email format
            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new { success = false, error = "Invalid email format" });
            }

            // Validate password length
            if (request.Password.Length < 6)
            {
                return BadRequest(new { success = false, error = "Password must be at least 6 characters long" });
            }

            // Validate role
            if (string.IsNullOrEmpty(request.Role))
            {
                return BadRequest(new { success = false, error = "Role is required" });
            }

            var allowedRoles = new[] { "admin", "teacher", "student" };
            if (!allowedRoles.Contains(request.Role.ToLower()))
            {
                return BadRequest(new { success = false, error = "Role must be one of: admin, teacher, student" });
            }

            // Validate PIN for admin accounts
            if (request.Role.ToLower() == "admin")
            {
                if (string.IsNullOrEmpty(request.Pin))
                {
                    return BadRequest(new { success = false, error = "PIN is required for admin accounts" });
                }
                
                if (request.Pin != "1111")
                {
                    return BadRequest(new { success = false, error = "Invalid admin PIN" });
                }
            }

            // Validate outreach source
            if (string.IsNullOrEmpty(request.OutreachSource))
            {
                return BadRequest(new { success = false, error = "Outreach source is required" });
            }

            var allowedSources = new[] { "Social Media", "Word of Mouth", "Online Ads", "Event/Workshop", "Not Specified" };
            if (!allowedSources.Contains(request.OutreachSource))
            {
                return BadRequest(new { success = false, error = "Invalid outreach source" });
            }

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Check if email already exists
            var checkEmailCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Email = @email", connection);
            checkEmailCmd.Parameters.AddWithValue("@email", request.Email.ToLower());
            var count = checkEmailCmd.ExecuteScalar();

            if (count != null && Convert.ToInt32(count) > 0)
            {
                return BadRequest(new { success = false, error = "Email already exists" });
            }

            // Hash password
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Insert new user
            var insertCmd = new SqliteCommand(
                "INSERT INTO Users (Email, Password, Role, Pin, OutreachSource, CreatedAt) VALUES (@email, @password, @role, @pin, @outreachSource, datetime('now'))",
                connection);
            insertCmd.Parameters.AddWithValue("@email", request.Email.ToLower());
            insertCmd.Parameters.AddWithValue("@password", hashedPassword);
            insertCmd.Parameters.AddWithValue("@role", request.Role.ToLower());
            insertCmd.Parameters.AddWithValue("@pin", request.Role.ToLower() == "admin" ? request.Pin : (object)DBNull.Value);
            insertCmd.Parameters.AddWithValue("@outreachSource", request.OutreachSource ?? "Not Specified");
            insertCmd.ExecuteNonQuery();

            // Get the inserted user ID
            var getIdCmd = new SqliteCommand("SELECT last_insert_rowid()", connection);
            var userId = getIdCmd.ExecuteScalar();

            return Ok(new { success = true, message = "User created successfully", userId = userId });
        }
        catch (SqliteException ex)
        {
            return StatusCode(500, new { success = false, error = $"Database error: {ex.Message}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = $"An error occurred: {ex.Message}" });
        }
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        try
        {
            // Validation
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, error = "Email and password are required" });
            }

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Find user by email
            var getUserCmd = new SqliteCommand("SELECT Id, Email, Password, Role, Pin FROM Users WHERE Email = @email", connection);
            getUserCmd.Parameters.AddWithValue("@email", request.Email.ToLower());
            
            using var reader = getUserCmd.ExecuteReader();
            
            if (!reader.Read())
            {
                return Unauthorized(new { success = false, error = "Invalid email" });
            }

            var userId = reader.GetInt32(0);
            var email = reader.GetString(1);
            var storedPasswordHash = reader.GetString(2);
            var role = reader.GetString(3);
            var storedPin = reader.IsDBNull(4) ? null : reader.GetString(4);

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, storedPasswordHash))
            {
                return Unauthorized(new { success = false, error = "Incorrect password" });
            }

            // Verify PIN for admin accounts
            if (role.ToLower() == "admin")
            {
                if (string.IsNullOrEmpty(request.Pin))
                {
                    return Unauthorized(new { success = false, error = "PIN is required for admin accounts" });
                }
                
                if (request.Pin != storedPin)
                {
                    return Unauthorized(new { success = false, error = "Incorrect PIN" });
                }
            }

            // Generate JWT token
            var token = _jwtService.GenerateToken(userId, email, role);

            return Ok(new 
            { 
                success = true, 
                message = "Login successful",
                token = token,
                user = new 
                {
                    userId = userId,
                    email = email,
                    role = role
                }
            });
        }
        catch (SqliteException ex)
        {
            return StatusCode(500, new { success = false, error = $"Database error: {ex.Message}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = $"An error occurred: {ex.Message}" });
        }
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
            return regex.IsMatch(email);
        }
        catch
        {
            return false;
        }
    }

    public class SignupRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role { get; set; } = "";
        public string? Pin { get; set; }
        public string? OutreachSource { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string? Pin { get; set; }
    }
}
