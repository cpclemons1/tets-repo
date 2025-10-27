using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using FreelanceMusic.Services;

namespace FreelanceMusic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";
        private readonly JwtService _jwtService;

        public AdminController(JwtService jwtService)
        {
            _jwtService = jwtService;
        }

        // ==================== JWT-Based Profile Endpoints ====================

        // GET /api/admin/profile - Get current user's profile using JWT
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Email, Role, Name FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Admin profile not found" });
                }
                
                var admin = new
                {
                    Id = reader.GetInt32(0),
                    Email = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Role = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    Name = reader.IsDBNull(3) ? "" : reader.GetString(3)
                };
                
                return Ok(new { success = true, data = admin });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/admin/profile - Update current user's profile using JWT
        [HttpPut("profile")]
        public IActionResult UpdateProfile([FromBody] UpdateAdminProfileRequest request)
        {
            try
            {
                Console.WriteLine($"UpdateProfile called with Name: {request?.Name}");
                
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    Console.WriteLine("No authorization token found");
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    Console.WriteLine("Could not extract user info from token");
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                Console.WriteLine($"Updating profile for email: {email}");
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                if (request == null)
                {
                    return BadRequest(new { success = false, error = "Request body is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if admin exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count == null || Convert.ToInt32(count) == 0)
                {
                    return NotFound(new { success = false, error = "Admin profile not found" });
                }

                // For admin, we can update the name and role (email is read-only)
                var updateFields = new List<string>();
                var parameters = new List<SqliteParameter>();

                if (!string.IsNullOrEmpty(request.Name))
                {
                    updateFields.Add("Name = @name");
                    parameters.Add(new SqliteParameter("@name", request.Name));
                }

                if (!string.IsNullOrEmpty(request.Role))
                {
                    updateFields.Add("Role = @role");
                    parameters.Add(new SqliteParameter("@role", request.Role));
                }

                if (updateFields.Count > 0)
                {
                    var sql = $"UPDATE Users SET {string.Join(", ", updateFields)} WHERE Email = @email AND Role = 'admin'";
                    Console.WriteLine($"Executing SQL: {sql}");
                    Console.WriteLine($"Parameters: Name={request.Name}, Email={email}");
                    
                    var updateCmd = new SqliteCommand(sql, connection);
                    
                    foreach (var param in parameters)
                    {
                        updateCmd.Parameters.Add(param);
                    }
                    updateCmd.Parameters.AddWithValue("@email", email);
                    
                    var rowsAffected = updateCmd.ExecuteNonQuery();
                    Console.WriteLine($"Rows affected: {rowsAffected}");
                }

                return Ok(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/admin/profile - Delete current user's profile using JWT
        [HttpDelete("profile")]
        public IActionResult DeleteProfile()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Delete the admin user
                var deleteCommand = new SqliteCommand("DELETE FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Admin profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Admin profile not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/admin/profile - Create profile for current user using JWT (Admin profiles are created during signup)
        [HttpPost("profile")]
        public IActionResult CreateProfile()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if admin profile already exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count != null && Convert.ToInt32(count) > 0)
                {
                    return BadRequest(new { success = false, error = "Admin profile already exists" });
                }

                // Admin profiles are created during signup, so this should not happen
                return BadRequest(new { success = false, error = "Admin profile should be created during signup" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/cancellation-report
        [HttpGet("cancellation-report")]
        public IActionResult GetCancellationReport()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    @"SELECT c.LessonId, c.StudentId, c.CancelledAt, c.Reason, 
                             l.Instrument, l.TimeSlot, l.Price,
                             s.Name as StudentName, s.Email as StudentEmail,
                             t.Name as TeacherName, t.Email as TeacherEmail
                      FROM CancellationLog c
                      LEFT JOIN Lessons l ON c.LessonId = l.Id
                      LEFT JOIN Students s ON c.StudentId = s.Id
                      LEFT JOIN Teachers t ON l.TeacherId = t.Id
                      ORDER BY c.CancelledAt DESC",
                    connection);

                using var reader = command.ExecuteReader();
                var cancellations = new List<object>();

                while (reader.Read())
                {
                    cancellations.Add(new
                    {
                        LessonId = reader.GetInt32(0),
                        StudentId = reader.GetInt32(1),
                        CancelledAt = reader.GetDateTime(2),
                        Reason = reader.GetString(3),
                        Instrument = reader.IsDBNull(4) ? "" : reader.GetString(4),
                        TimeSlot = reader.IsDBNull(5) ? "" : reader.GetString(5),
                        Price = reader.IsDBNull(6) ? 0 : reader.GetDecimal(6),
                        StudentName = reader.IsDBNull(7) ? "Unknown" : reader.GetString(7),
                        StudentEmail = reader.IsDBNull(8) ? "" : reader.GetString(8),
                        TeacherName = reader.IsDBNull(9) ? "Unknown" : reader.GetString(9),
                        TeacherEmail = reader.IsDBNull(10) ? "" : reader.GetString(10)
                    });
                }

                return Ok(new { success = true, data = cancellations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
        [HttpGet("revenue-report")]
        public IActionResult GetRevenueReport()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Quarter, Revenue, Source FROM Reports ORDER BY Quarter DESC", connection);
                using var reader = command.ExecuteReader();

                var revenueData = new List<object>();
                while (reader.Read())
                {
                    revenueData.Add(new
                    {
                        Quarter = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0),
                        Revenue = reader.IsDBNull(1) ? 0 : reader.GetDecimal(1),
                        Source = reader.IsDBNull(2) ? "Unknown" : reader.GetString(2)
                    });
                }

                return Ok(new { success = true, data = revenueData });
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

        // GET /api/admin/instrument-popularity
        [HttpGet("instrument-popularity")]
        public IActionResult GetInstrumentPopularity()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Instrument, COUNT(*) as Count FROM Lessons GROUP BY Instrument ORDER BY Count DESC", connection);
                using var reader = command.ExecuteReader();

                var popularityData = new List<object>();
                while (reader.Read())
                {
                    popularityData.Add(new
                    {
                        Instrument = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0),
                        Count = reader.IsDBNull(1) ? 0 : reader.GetInt64(1)
                    });
                }

                return Ok(new { success = true, data = popularityData });
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

        // GET /api/admin/lesson-schedule
        [HttpGet("lesson-schedule")]
        public IActionResult GetLessonSchedule()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT l.Id, l.TeacherId, l.TimeSlot, l.Instrument, l.LessonType, l.Price, l.StudentId, s.Name as StudentName, t.Name as TeacherName
                    FROM Lessons l
                    LEFT JOIN Students s ON l.StudentId = s.Id
                    LEFT JOIN Teachers t ON l.TeacherId = t.Id
                    WHERE l.StudentId IS NOT NULL
                    ORDER BY l.TimeSlot", connection);
                using var reader = command.ExecuteReader();

                var scheduleData = new List<object>();
                while (reader.Read())
                {
                    scheduleData.Add(new
                    {
                        Id = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                        TeacherId = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                        TeacherName = reader.IsDBNull(8) ? "Unknown" : reader.GetString(8),
                        TimeSlot = reader.IsDBNull(2) ? "Unknown" : reader.GetString(2),
                        Instrument = reader.IsDBNull(3) ? "Unknown" : reader.GetString(3),
                        LessonType = reader.IsDBNull(4) ? "Unknown" : reader.GetString(4),
                        Price = reader.IsDBNull(5) ? 0.0m : reader.GetDecimal(5),
                        StudentId = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                        StudentName = reader.IsDBNull(7) ? "Unknown" : reader.GetString(7)
                    });
                }

                return Ok(new { success = true, data = scheduleData });
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

        // GET /api/admin/user-stats
        [HttpGet("user-stats")]
        public IActionResult GetUserStats()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var stats = new Dictionary<string, object>();
                
                // Count teachers
                var teacherCountCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Role = 'teacher'", connection);
                var teacherCount = teacherCountCmd.ExecuteScalar();
                stats["TeacherCount"] = teacherCount == null ? 0 : Convert.ToInt32(teacherCount);

                // Count students
                var studentCountCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Role = 'student'", connection);
                var studentCount = studentCountCmd.ExecuteScalar();
                stats["StudentCount"] = studentCount == null ? 0 : Convert.ToInt32(studentCount);

                // Count admins
                var adminCountCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Role = 'admin'", connection);
                var adminCount = adminCountCmd.ExecuteScalar();
                stats["AdminCount"] = adminCount == null ? 0 : Convert.ToInt32(adminCount);

                // Total users
                stats["totalUsers"] = (int)stats["TeacherCount"] + (int)stats["StudentCount"] + (int)stats["AdminCount"];

                // Follow-up lesson percentage (students who booked more than 1 lesson)
                var followUpCmd = new SqliteCommand(
                    "SELECT COUNT(DISTINCT StudentId) FROM (SELECT StudentId, COUNT(*) as LessonCount FROM Lessons WHERE StudentId IS NOT NULL GROUP BY StudentId HAVING LessonCount > 1)",
                    connection);
                var followUpStudents = followUpCmd.ExecuteScalar();
                var totalStudentsWithLessons = new SqliteCommand("SELECT COUNT(DISTINCT StudentId) FROM Lessons WHERE StudentId IS NOT NULL", connection).ExecuteScalar();
                
                double followUpPercentage = 0;
                if (totalStudentsWithLessons != null && Convert.ToInt32(totalStudentsWithLessons) > 0)
                {
                    followUpPercentage = (followUpStudents == null ? 0 : Convert.ToDouble(followUpStudents)) / Convert.ToDouble(totalStudentsWithLessons) * 100;
                }
                stats["followUpPercentage"] = Math.Round(followUpPercentage, 1).ToString();

                // Retention rate (students with at least 1 lesson / total students * 100)
                double retentionRate = 0;
                if ((int)stats["StudentCount"] > 0)
                {
                    retentionRate = (totalStudentsWithLessons == null ? 0 : Convert.ToDouble(totalStudentsWithLessons)) / (int)stats["StudentCount"] * 100;
                }
                stats["retentionRate"] = Math.Round(retentionRate, 1).ToString();

                return Ok(new { success = true, data = stats });
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

        // GET /api/admin/outreach-sources
        [HttpGet("outreach-sources")]
        public IActionResult GetOutreachSources()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        COALESCE(OutreachSource, 'Not Specified') as Source,
                        COUNT(*) as Count,
                        Role
                    FROM Users 
                    GROUP BY COALESCE(OutreachSource, 'Not Specified'), Role
                    ORDER BY Count DESC", connection);
                using var reader = command.ExecuteReader();

                var outreachData = new List<object>();
                while (reader.Read())
                {
                    outreachData.Add(new
                    {
                        Source = reader.IsDBNull(0) ? "Not Specified" : reader.GetString(0),
                        Count = reader.IsDBNull(1) ? 0 : reader.GetInt64(1),
                        Role = reader.IsDBNull(2) ? "Unknown" : reader.GetString(2)
                    });
                }

                return Ok(new { success = true, data = outreachData });
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

        // PUT /api/admin/update-user (can update student or teacher profiles)
        [HttpPut("update-user")]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Role))
                {
                    return BadRequest(new { success = false, error = "Role is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                if (request.Role.ToLower() == "student")
                {
                    if (request.StudentId == 0)
                    {
                        return BadRequest(new { success = false, error = "StudentId is required" });
                    }

                    // Update student
                    var updateCmd = new SqliteCommand(
                        "UPDATE Students SET Name = @name, Email = @email WHERE Id = @id",
                        connection);
                    
                    updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                    updateCmd.Parameters.AddWithValue("@email", request.Email ?? "");
                    updateCmd.Parameters.AddWithValue("@id", request.StudentId);
                    
                    updateCmd.ExecuteNonQuery();

                    return Ok(new { success = true, message = "Student profile updated successfully" });
                }
                else if (request.Role.ToLower() == "teacher")
                {
                    if (request.TeacherId == 0)
                    {
                        return BadRequest(new { success = false, error = "TeacherId is required" });
                    }

                    // Update teacher
                    var updateCmd = new SqliteCommand(
                        "UPDATE Teachers SET Name = @name, Email = @email WHERE Id = @id",
                        connection);
                    
                    updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                    updateCmd.Parameters.AddWithValue("@email", request.Email ?? "");
                    updateCmd.Parameters.AddWithValue("@id", request.TeacherId);
                    
                    updateCmd.ExecuteNonQuery();

                    return Ok(new { success = true, message = "Teacher profile updated successfully" });
                }
                else if (request.Role.ToLower() == "admin" || request.Role.ToLower() == "user")
                {
                    if (request.UserId == 0)
                    {
                        return BadRequest(new { success = false, error = "UserId is required" });
                    }

                    // Check if user exists
                    var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Users WHERE Id = @id", connection);
                    checkCmd.Parameters.AddWithValue("@id", request.UserId);
                    var count = checkCmd.ExecuteScalar();
                    
                    if (count == null || Convert.ToInt32(count) == 0)
                    {
                        return NotFound(new { success = false, error = "User not found" });
                    }

                    // Update user
                    var updateCmd = new SqliteCommand(
                        "UPDATE Users SET Email = @email, Role = @role WHERE Id = @id",
                        connection);
                    
                    updateCmd.Parameters.AddWithValue("@email", request.Email ?? "");
                    updateCmd.Parameters.AddWithValue("@role", request.NewRole ?? "");
                    updateCmd.Parameters.AddWithValue("@id", request.UserId);
                    
                    updateCmd.ExecuteNonQuery();

                    return Ok(new { success = true, message = "User profile updated successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, error = "Invalid role" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/by-email/{email}
        [HttpGet("by-email/{email}")]
        public IActionResult GetAdminByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Email, Role FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Admin not found" });
                }
                
                var admin = new
                {
                    Id = reader.GetInt32(0),
                    Email = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Role = reader.IsDBNull(2) ? "" : reader.GetString(2)
                };
                
                return Ok(new { success = true, data = admin });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/admin/by-email/{email}
        [HttpDelete("by-email/{email}")]
        public IActionResult DeleteAdminByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Delete the admin user
                var deleteCommand = new SqliteCommand("DELETE FROM Users WHERE Email = @email AND Role = 'admin'", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Admin profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Admin not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // ==================== Analytics Endpoints ====================

        // GET /api/admin/analytics/revenue-quarterly - Get revenue per quarter
        [HttpGet("analytics/revenue-quarterly")]
        public IActionResult GetRevenueByQuarter()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        CASE 
                            WHEN CAST(strftime('%m', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) AS INTEGER) BETWEEN 1 AND 3 THEN strftime('%Y', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) || ' Q1'
                            WHEN CAST(strftime('%m', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) AS INTEGER) BETWEEN 4 AND 6 THEN strftime('%Y', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) || ' Q2'
                            WHEN CAST(strftime('%m', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) AS INTEGER) BETWEEN 7 AND 9 THEN strftime('%Y', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) || ' Q3'
                            ELSE strftime('%Y', datetime(replace(substr(l.TimeSlot, 1, CASE WHEN instr(l.TimeSlot, ' - ') > 0 THEN instr(l.TimeSlot, ' - ') - 1 ELSE 19 END), 'T', ' '))) || ' Q4'
                        END as Quarter,
                        COALESCE(SUM(l.Price), 0) as Revenue
                    FROM Lessons l
                    WHERE l.StudentId IS NOT NULL AND l.TimeSlot IS NOT NULL AND l.TimeSlot != ''
                    GROUP BY Quarter
                    ORDER BY Quarter
                ", connection);

                var quarters = new List<object>();
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    quarters.Add(new
                    {
                        Quarter = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0),
                        Revenue = reader.IsDBNull(1) ? 0.0 : reader.GetDouble(1)
                    });
                }

                return Ok(new { success = true, data = quarters });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/analytics/student-sources - Get breakdown of how students heard about Freelance Music
        [HttpGet("analytics/student-sources")]
        public IActionResult GetStudentSources()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        COALESCE(OutreachSource, 'Not Specified') as Source,
                        COUNT(*) as Count
                    FROM Students
                    GROUP BY COALESCE(OutreachSource, 'Not Specified')
                    ORDER BY Count DESC
                ", connection);

                var sources = new List<object>();
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    sources.Add(new
                    {
                        Source = reader.GetString(0),
                        Count = reader.GetInt32(1)
                    });
                }

                return Ok(new { success = true, data = sources });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/analytics/popular-instruments - Get most popular instruments
        [HttpGet("analytics/popular-instruments")]
        public IActionResult GetPopularInstruments()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        Instrument,
                        COUNT(*) as BookedLessons,
                        COALESCE(SUM(Price), 0) as Revenue
                    FROM Lessons
                    WHERE StudentId IS NOT NULL
                    GROUP BY Instrument
                    ORDER BY BookedLessons DESC
                ", connection);

                var instruments = new List<object>();
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    instruments.Add(new
                    {
                        Instrument = reader.GetString(0),
                        BookedLessons = reader.GetInt32(1),
                        Revenue = reader.GetDouble(2)
                    });
                }

                return Ok(new { success = true, data = instruments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/analytics/booked-lessons - Get all booked lessons
        [HttpGet("analytics/booked-lessons")]
        public IActionResult GetBookedLessons()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        l.Id,
                        l.TimeSlot,
                        l.Instrument,
                        l.Price,
                        l.Notes,
                        l.lesson_type,
                        l.student_lesson_type,
                        s.Name as StudentName,
                        s.Email as StudentEmail,
                        t.Name as TeacherName,
                        t.Email as TeacherEmail
                    FROM Lessons l
                    LEFT JOIN Students s ON l.StudentId = s.Id
                    LEFT JOIN Teachers t ON l.TeacherId = t.Id
                    WHERE l.StudentId IS NOT NULL
                    ORDER BY l.TimeSlot DESC
                ", connection);

                var lessons = new List<object>();
                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    lessons.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TimeSlot = reader.GetString(1),
                        Instrument = reader.GetString(2),
                        Price = reader.IsDBNull(3) ? 0 : reader.GetDouble(3),
                        Notes = reader.IsDBNull(4) ? null : reader.GetString(4),
                        LessonType = reader.IsDBNull(5) ? "In-Person" : reader.GetString(5),
                        StudentLessonType = reader.IsDBNull(6) ? null : reader.GetString(6),
                        StudentName = reader.IsDBNull(7) ? "Unknown" : reader.GetString(7),
                        StudentEmail = reader.IsDBNull(8) ? "Unknown" : reader.GetString(8),
                        TeacherName = reader.IsDBNull(9) ? "Unknown" : reader.GetString(9),
                        TeacherEmail = reader.IsDBNull(10) ? "Unknown" : reader.GetString(10)
                    });
                }

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/analytics/user-counts - Get total number of students and teachers
        [HttpGet("analytics/user-counts")]
        public IActionResult GetUserCounts()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    SELECT 
                        (SELECT COUNT(*) FROM Students) as StudentCount,
                        (SELECT COUNT(*) FROM Teachers) as TeacherCount,
                        (SELECT COUNT(*) FROM Users WHERE Role = 'admin') as AdminCount
                ", connection);

                using var reader = command.ExecuteReader();
                if (reader.Read())
                {
                    var counts = new
                    {
                        StudentCount = reader.GetInt32(0),
                        TeacherCount = reader.GetInt32(1),
                        AdminCount = reader.GetInt32(2)
                    };

                    return Ok(new { success = true, data = counts });
                }

                return StatusCode(500, new { success = false, error = "Failed to retrieve user counts" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/admin/analytics/second-lesson-tracking - Get percentage of students who booked a second lesson
        [HttpGet("analytics/second-lesson-tracking")]
        public IActionResult GetSecondLessonTracking()
        {
            try
            {
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized(new { success = false, error = "Authorization token required" });
                }

                var userInfo = _jwtService.GetUserFromToken(token);
                if (userInfo == null)
                {
                    return Unauthorized(new { success = false, error = "Invalid or expired token" });
                }

                var (userId, email, role) = userInfo.Value;
                if (role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(@"
                    WITH StudentLessonCounts AS (
                        SELECT 
                            l.StudentId,
                            COUNT(*) as LessonCount,
                            MIN(l.TimeSlot) as FirstLessonTime
                        FROM Lessons l
                        INNER JOIN Users u ON l.StudentId = u.Id
                        WHERE l.StudentId IS NOT NULL AND u.Role = 'student'
                        GROUP BY l.StudentId
                    ),
                    CompletedFirstLessons AS (
                        SELECT StudentId
                        FROM StudentLessonCounts
                        WHERE LessonCount >= 1
                    ),
                    StudentsWithSecondLesson AS (
                        SELECT StudentId
                        FROM StudentLessonCounts
                        WHERE LessonCount >= 2
                    )
                    SELECT 
                        (SELECT COUNT(*) FROM CompletedFirstLessons) as StudentsWithCompletedFirstLesson,
                        (SELECT COUNT(*) FROM StudentsWithSecondLesson) as StudentsWithSecondLesson
                ", connection);

                using var reader = command.ExecuteReader();
                if (reader.Read())
                {
                    var completedFirstLessons = reader.GetInt32(0);
                    var studentsWithSecondLesson = reader.GetInt32(1);
                    var percentage = completedFirstLessons > 0 ? (double)studentsWithSecondLesson / completedFirstLessons * 100 : 0;

                    var tracking = new
                    {
                        StudentsWithCompletedFirstLesson = completedFirstLessons,
                        StudentsWithSecondLesson = studentsWithSecondLesson,
                        Percentage = Math.Round(percentage, 2)
                    };

                    return Ok(new { success = true, data = tracking });
                }

                return StatusCode(500, new { success = false, error = "Failed to retrieve second lesson tracking data" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class UpdateUserRequest
    {
        public string Role { get; set; } = "";
        public int StudentId { get; set; }
        public int TeacherId { get; set; }
        public int UserId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? NewRole { get; set; }
    }

    public class UpdateAdminProfileRequest
    {
        public string? Name { get; set; }
        public string? Role { get; set; }
    }
}
