using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using FreelanceMusic.Services;

namespace FreelanceMusic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";
        private readonly JwtService _jwtService;

        public StudentController(JwtService jwtService)
        {
            _jwtService = jwtService;
        }

        // POST /api/student/create
        [HttpPost("create")]
        public IActionResult CreateStudent([FromBody] StudentRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { success = false, error = "Name and Email are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    "INSERT INTO Students (Name, Email, CardNumber, ExpiryDate, Instrument, Pin) VALUES (@name, @email, @cardNumber, @expiryDate, @instrument, @pin)",
                    connection);

                command.Parameters.AddWithValue("@name", request.Name);
                command.Parameters.AddWithValue("@email", request.Email);
                command.Parameters.AddWithValue("@cardNumber", request.CardNumber ?? "");
                command.Parameters.AddWithValue("@expiryDate", request.ExpiryDate ?? "");
                command.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                command.Parameters.AddWithValue("@pin", request.Pin ?? "");

                command.ExecuteNonQuery();

                return Ok(new { success = true, message = "Student created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/student/availability
        [HttpGet("availability")]
        public IActionResult GetAvailability([FromQuery] string? instrument)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                string query = "SELECT Id, TeacherId, TimeSlot, Instrument, LessonType, Price FROM Lessons WHERE StudentId IS NULL AND TimeSlot > datetime('now')";
                var command = new SqliteCommand(query, connection);

                if (!string.IsNullOrEmpty(instrument))
                {
                    query += " AND Instrument = @instrument AND TimeSlot > datetime('now')";
                    command = new SqliteCommand(query, connection);
                    command.Parameters.AddWithValue("@instrument", instrument);
                }

                using var reader = command.ExecuteReader();

                var lessons = new List<object>();
                while (reader.Read())
                {
                    lessons.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        TimeSlot = reader.GetString(2),
                        Instrument = reader.GetString(3),
                        LessonType = reader.GetString(4),
                        Price = reader.GetDecimal(5),
                        Status = "Available"
                    });
                }

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/student/book
        [HttpPost("book")]
        public IActionResult BookLesson([FromBody] BookRequest request)
        {
            try
            {
                if (request == null || request.StudentId == 0 || request.LessonId == 0)
                {
                    return BadRequest(new { success = false, error = "StudentId and LessonId are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if lesson is available (StudentId must be NULL)
                var checkCommand = new SqliteCommand("SELECT TeacherId, StudentId FROM Lessons WHERE Id = @lessonId", connection);
                checkCommand.Parameters.AddWithValue("@lessonId", request.LessonId);
                
                using var checkReader = checkCommand.ExecuteReader();
                if (!checkReader.Read())
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }

                int teacherId = checkReader.GetInt32(0);
                int? studentIdValue = checkReader.IsDBNull(1) ? null : checkReader.GetInt32(1);

                if (studentIdValue != null)
                {
                    return BadRequest(new { success = false, error = "Lesson is already booked" });
                }

                // Update lesson with StudentId
                var updateCommand = new SqliteCommand(
                    "UPDATE Lessons SET StudentId = @studentId WHERE Id = @lessonId",
                    connection);
                updateCommand.Parameters.AddWithValue("@studentId", request.StudentId);
                updateCommand.Parameters.AddWithValue("@lessonId", request.LessonId);
                updateCommand.ExecuteNonQuery();

                return Ok(new { success = true, message = "Lesson booked successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/student/by-email/{email}
        [HttpGet("by-email/{email}")]
        public IActionResult GetStudentByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Email, CardNumber, ExpiryDate, Instrument FROM Students WHERE Email = @email", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Student not found" });
                }
                
                var student = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Email = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    CardNumber = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    ExpiryDate = reader.IsDBNull(4) ? "" : reader.GetString(4),
                    Instrument = reader.IsDBNull(5) ? "" : reader.GetString(5)
                };
                
                return Ok(new { success = true, data = student });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/student/by-email/{email}
        [HttpDelete("by-email/{email}")]
        public IActionResult DeleteStudentByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First check if student exists
                var checkCommand = new SqliteCommand("SELECT Id FROM Students WHERE Email = @email", connection);
                checkCommand.Parameters.AddWithValue("@email", email);
                
                using var reader = checkCommand.ExecuteReader();
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Student not found" });
                }
                
                var studentId = reader.GetInt32(0);
                reader.Close();

                // Delete any lessons associated with this student
                var deleteLessonsCommand = new SqliteCommand("UPDATE Lessons SET StudentId = NULL WHERE StudentId = @studentId", connection);
                deleteLessonsCommand.Parameters.AddWithValue("@studentId", studentId);
                deleteLessonsCommand.ExecuteNonQuery();

                // Delete the student
                var deleteCommand = new SqliteCommand("DELETE FROM Students WHERE Email = @email", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Student profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Student not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/student/{id}
        [HttpGet("{id}")]
        public IActionResult GetStudent(int id)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Email, CardNumber, ExpiryDate, Instrument FROM Students WHERE Id = @id", connection);
                command.Parameters.AddWithValue("@id", id);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Student not found" });
                }
                
                var student = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Email = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    CardNumber = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    ExpiryDate = reader.IsDBNull(4) ? "" : reader.GetString(4),
                    Instrument = reader.IsDBNull(5) ? "" : reader.GetString(5)
                };
                
                return Ok(new { success = true, data = student });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/student/update-profile
        [HttpPut("update-profile")]
        public IActionResult UpdateProfile([FromBody] UpdateStudentRequest request)
        {
            try
            {
                if (request == null || request.StudentId == 0)
                {
                    return BadRequest(new { success = false, error = "StudentId is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if student exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Students WHERE Id = @id", connection);
                checkCmd.Parameters.AddWithValue("@id", request.StudentId);
                var count = checkCmd.ExecuteScalar();
                
                if (count == null || Convert.ToInt32(count) == 0)
                {
                    return NotFound(new { success = false, error = "Student not found" });
                }

                // Update student
                var updateCmd = new SqliteCommand(
                    "UPDATE Students SET Name = @name, Email = @email, CardNumber = @cardNumber, ExpiryDate = @expiryDate, Instrument = @instrument, Pin = @pin WHERE Id = @id",
                    connection);
                
                updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                updateCmd.Parameters.AddWithValue("@email", request.Email ?? "");
                updateCmd.Parameters.AddWithValue("@cardNumber", request.CardNumber ?? "");
                updateCmd.Parameters.AddWithValue("@expiryDate", request.ExpiryDate ?? "");
                updateCmd.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                updateCmd.Parameters.AddWithValue("@pin", request.Pin ?? "");
                updateCmd.Parameters.AddWithValue("@id", request.StudentId);
                
                updateCmd.ExecuteNonQuery();

                return Ok(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/student/verify-card
        [HttpPost("verify-card")]
        public IActionResult VerifyCard([FromBody] CardRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.CardNumber) || string.IsNullOrEmpty(request.ExpiryDate) || string.IsNullOrEmpty(request.Pin))
                {
                    return BadRequest(new { success = false, error = "CardNumber, ExpiryDate, and Pin are required" });
                }

                // Validate card number format (14 digits only)
                if (request.CardNumber.Length != 14 || !System.Text.RegularExpressions.Regex.IsMatch(request.CardNumber, @"^\d+$"))
                {
                    return BadRequest(new { success = false, error = "Card number must be exactly 14 digits" });
                }

                // Validate expiry date format (MM/YY)
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.ExpiryDate, @"^(0[1-9]|1[0-2])\/\d{2}$"))
                {
                    return BadRequest(new { success = false, error = "Expiry date must be in MM/YY format" });
                }

                // Validate PIN (3-4 digits)
                if (request.Pin.Length < 3 || request.Pin.Length > 4 || !System.Text.RegularExpressions.Regex.IsMatch(request.Pin, @"^\d+$"))
                {
                    return BadRequest(new { success = false, error = "PIN must be 3 or 4 digits" });
                }

                // Parse expiry date to check if it's in the future
                var expiryParts = request.ExpiryDate.Split('/');
                var expiryMonth = int.Parse(expiryParts[0]);
                var expiryYear = 2000 + int.Parse(expiryParts[1]);
                var expiryDate = new DateTime(expiryYear, expiryMonth, DateTime.DaysInMonth(expiryYear, expiryMonth));
                
                if (expiryDate < DateTime.Now)
                {
                    return BadRequest(new { success = false, error = "Card has expired" });
                }

                // Card verification passed (format and expiry only - no actual payment processing)
                return Ok(new { 
                    success = true, 
                    message = "Card format verified successfully (no payment processed)",
                    maskedCard = "****-****-****-" + request.CardNumber.Substring(request.CardNumber.Length - 4)
                });
            }
            catch (FormatException)
            {
                return BadRequest(new { success = false, error = "Invalid date format" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = $"An error occurred: {ex.Message}" });
            }
        }

        // ==================== JWT-Based Profile Endpoints ====================

        // GET /api/student/available-lessons
        [HttpGet("available-lessons")]
        public IActionResult GetAvailableLessons()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    @"SELECT l.Id, l.TeacherId, l.Instrument, l.LessonType, l.lesson_type, l.TimeSlot, l.Price, l.Notes, 
                             t.Name as TeacherName, t.Email as TeacherEmail
                      FROM Lessons l 
                      LEFT JOIN Teachers t ON l.TeacherId = t.Id 
                      WHERE l.StudentId IS NULL 
                      AND l.TimeSlot > datetime('now')
                      ORDER BY l.TimeSlot ASC",
                    connection);

                using var reader = command.ExecuteReader();
                var lessons = new List<object>();

                while (reader.Read())
                {
                    lessons.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        Instrument = reader.GetString(2),
                        LessonType = reader.IsDBNull(3) ? "virtual" : reader.GetString(3),
                        LessonTypeNew = reader.IsDBNull(4) ? "In-Person" : reader.GetString(4),
                        TimeSlot = reader.GetString(5),
                        Price = reader.GetDecimal(6),
                        Notes = reader.IsDBNull(7) ? "" : reader.GetString(7),
                        TeacherName = reader.IsDBNull(8) ? "Unknown Teacher" : reader.GetString(8),
                        TeacherEmail = reader.IsDBNull(9) ? "" : reader.GetString(9),
                        DisplayLessonType = reader.IsDBNull(4) ? "In-Person" : reader.GetString(4)
                    });
                }

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/student/book-lesson
        [HttpPost("upload-sheet-music")]
        public async Task<IActionResult> UploadSheetMusic(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { success = false, error = "No file uploaded" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { success = false, error = "Invalid file type. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX" });
                }

                // Validate file size (10MB limit)
                if (file.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { success = false, error = "File size too large. Maximum size is 10MB" });
                }

                // Create uploads directory if it doesn't exist
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "sheet-music");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generate unique filename to prevent conflicts
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return file info
                return Ok(new { 
                    success = true, 
                    fileName = file.FileName,
                    filePath = $"/uploads/sheet-music/{fileName}",
                    size = file.Length
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("book-lesson")]
        public IActionResult BookLesson([FromBody] BookLessonRequest request)
        {
            try
            {
                // Validate request
                if (request == null || request.LessonId <= 0)
                {
                    return BadRequest(new { success = false, error = "Valid LessonId is required" });
                }

                // Get student info from JWT token
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First, verify the student exists in the database
                var studentCheckCommand = new SqliteCommand(
                    "SELECT Id FROM Students WHERE Email = @email",
                    connection);
                studentCheckCommand.Parameters.AddWithValue("@email", email);
                
                using var studentReader = studentCheckCommand.ExecuteReader();
                if (!studentReader.Read())
                {
                    return BadRequest(new { success = false, error = "Student profile not found. Please create a profile first." });
                }
                
                int studentId = studentReader.GetInt32(0);
                studentReader.Close();

                // Check if lesson exists and is available
                var lessonCheckCommand = new SqliteCommand(
                    @"SELECT l.TeacherId, l.StudentId, l.TimeSlot, l.Instrument, l.Price, l.lesson_type,
                             t.Name as TeacherName, t.Email as TeacherEmail
                      FROM Lessons l 
                      LEFT JOIN Teachers t ON l.TeacherId = t.Id 
                      WHERE l.Id = @lessonId",
                    connection);
                lessonCheckCommand.Parameters.AddWithValue("@lessonId", request.LessonId);
                
                using var lessonReader = lessonCheckCommand.ExecuteReader();
                if (!lessonReader.Read())
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }

                var teacherId = lessonReader.GetInt32(0);
                var currentStudentId = lessonReader.IsDBNull(1) ? (int?)null : lessonReader.GetInt32(1);
                var timeSlot = lessonReader.GetString(2);
                var instrument = lessonReader.GetString(3);
                var price = lessonReader.GetDecimal(4);
                var lessonType = lessonReader.IsDBNull(5) ? "In-Person" : lessonReader.GetString(5);
                var teacherName = lessonReader.IsDBNull(6) ? "Unknown Teacher" : lessonReader.GetString(6);
                var teacherEmail = lessonReader.IsDBNull(7) ? "" : lessonReader.GetString(7);
                
                if (currentStudentId.HasValue)
                {
                    return BadRequest(new { success = false, error = "Lesson is already booked by another student" });
                }

                // Validate student lesson type for Student Preference lessons
                if (lessonType == "Student Preference")
                {
                    if (string.IsNullOrEmpty(request.StudentLessonType))
                    {
                        return BadRequest(new { success = false, error = "Student lesson type is required for Student Preference lessons" });
                    }
                    
                    if (!new[] { "In-Person", "Virtual" }.Contains(request.StudentLessonType))
                    {
                        return BadRequest(new { success = false, error = "Student lesson type must be 'In-Person' or 'Virtual'" });
                    }
                }
                else
                {
                    // For non-Student Preference lessons, use the lesson's type
                    request.StudentLessonType = lessonType;
                }

                // Verify teacher exists (additional safety check)
                if (teacherId <= 0)
                {
                    return BadRequest(new { success = false, error = "Invalid teacher for this lesson" });
                }

                lessonReader.Close();

                // Book the lesson by updating the StudentId, student_lesson_type, and booking details
                var bookCommand = new SqliteCommand(
                    "UPDATE Lessons SET StudentId = @studentId, student_lesson_type = @studentLessonType, SpecialRequests = @specialRequests, SheetMusicFileName = @sheetMusicFileName, SheetMusicFilePath = @sheetMusicFilePath WHERE Id = @lessonId",
                    connection);
                bookCommand.Parameters.AddWithValue("@studentId", studentId);
                bookCommand.Parameters.AddWithValue("@studentLessonType", request.StudentLessonType);
                bookCommand.Parameters.AddWithValue("@specialRequests", request.SpecialRequests ?? (object)DBNull.Value);
                bookCommand.Parameters.AddWithValue("@sheetMusicFileName", request.SheetMusicFileName ?? (object)DBNull.Value);
                bookCommand.Parameters.AddWithValue("@sheetMusicFilePath", request.SheetMusicFilePath ?? (object)DBNull.Value);
                bookCommand.Parameters.AddWithValue("@lessonId", request.LessonId);

                int rowsAffected = bookCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Lesson booked successfully",
                        data = new {
                            LessonId = request.LessonId,
                            StudentId = studentId,
                            TeacherId = teacherId,
                            TimeSlot = timeSlot,
                            Instrument = instrument,
                            Price = price,
                            LessonType = lessonType,
                            StudentLessonType = request.StudentLessonType,
                            TeacherName = teacherName,
                            TeacherEmail = teacherEmail,
                            Status = "Booked"
                        }
                    });
                }
                else
                {
                    return BadRequest(new { success = false, error = "Failed to book lesson. Please try again." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/student/cancel-lesson
        [HttpPost("cancel-lesson")]
        public IActionResult CancelLesson([FromBody] CancelLessonRequest request)
        {
            try
            {
                // Validate request
                if (request == null || request.LessonId <= 0)
                {
                    return BadRequest(new { success = false, error = "Valid LessonId is required" });
                }

                // Get student info from JWT token
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First, verify the student exists in the database
                var studentCheckCommand = new SqliteCommand(
                    "SELECT Id FROM Students WHERE Email = @email",
                    connection);
                studentCheckCommand.Parameters.AddWithValue("@email", email);
                
                using var studentReader = studentCheckCommand.ExecuteReader();
                if (!studentReader.Read())
                {
                    return BadRequest(new { success = false, error = "Student profile not found. Please create a profile first." });
                }
                
                int studentId = studentReader.GetInt32(0);
                studentReader.Close();

                // Check if lesson exists and belongs to the student
                var checkCommand = new SqliteCommand(
                    "SELECT StudentId FROM Lessons WHERE Id = @lessonId",
                    connection);
                checkCommand.Parameters.AddWithValue("@lessonId", request.LessonId);
                
                var currentStudentId = checkCommand.ExecuteScalar();
                if (currentStudentId == null)
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }

                if (Convert.ToInt32(currentStudentId) != studentId)
                {
                    return StatusCode(403, new { success = false, error = "You can only cancel your own lessons" });
                }

                // Log cancellation for admin reporting
                var logCommand = new SqliteCommand(
                    "INSERT INTO CancellationLog (LessonId, StudentId, CancelledAt, Reason) VALUES (@lessonId, @studentId, @cancelledAt, @reason)",
                    connection);
                logCommand.Parameters.AddWithValue("@lessonId", request.LessonId);
                logCommand.Parameters.AddWithValue("@studentId", studentId);
                logCommand.Parameters.AddWithValue("@cancelledAt", DateTime.UtcNow);
                logCommand.Parameters.AddWithValue("@reason", "Student cancellation");
                logCommand.ExecuteNonQuery();

                // Cancel the lesson
                var cancelCommand = new SqliteCommand(
                    "UPDATE Lessons SET StudentId = NULL WHERE Id = @lessonId",
                    connection);
                cancelCommand.Parameters.AddWithValue("@lessonId", request.LessonId);

                int rowsAffected = cancelCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Lesson cancelled successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, error = "Failed to cancel lesson" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/student/bookings
        [HttpGet("bookings")]
        public IActionResult GetStudentBookings()
        {
            try
            {
                // Get student info from JWT token
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First, verify the student exists in the database
                var studentCheckCommand = new SqliteCommand(
                    "SELECT Id FROM Students WHERE Email = @email",
                    connection);
                studentCheckCommand.Parameters.AddWithValue("@email", email);
                
                using var studentReader = studentCheckCommand.ExecuteReader();
                if (!studentReader.Read())
                {
                    return BadRequest(new { success = false, error = "Student profile not found. Please create a profile first." });
                }
                
                int studentId = studentReader.GetInt32(0);
                studentReader.Close();

                var command = new SqliteCommand(
                    @"SELECT l.Id, l.TeacherId, l.StudentId, l.Instrument, l.LessonType, l.lesson_type, l.student_lesson_type, l.TimeSlot, l.Price, l.Notes, 
                             t.Name as TeacherName, t.Email as TeacherEmail
                      FROM Lessons l 
                      LEFT JOIN Teachers t ON l.TeacherId = t.Id 
                      WHERE l.StudentId = @studentId 
                      ORDER BY l.TimeSlot ASC",
                    connection);

                command.Parameters.AddWithValue("@studentId", studentId);
                using var reader = command.ExecuteReader();

                var bookings = new List<object>();
                while (reader.Read())
                {
                    var timeSlot = reader.GetString(7); // Fixed: TimeSlot is at index 7, not 5
                    DateTime lessonStart, lessonEnd;
                    
                    // Handle both TimeSlot formats: "start - end" and single datetime
                    if (timeSlot.Contains(" - "))
                    {
                        // New format: "2025-10-27T18:00 - 2025-10-27T18:45"
                        var timeParts = timeSlot.Split(" - ");
                        lessonStart = DateTime.Parse(timeParts[0]);
                        lessonEnd = DateTime.Parse(timeParts[1]);
                    }
                    else
                    {
                        // Old format: single datetime (assume 1-hour duration)
                        lessonStart = DateTime.Parse(timeSlot);
                        lessonEnd = lessonStart.AddHours(1);
                    }
                    
                    var now = DateTime.Now;
                    
                    // Determine status based on current time
                    string status;
                    if (lessonEnd < now)
                    {
                        status = "Completed";
                    }
                    else if (lessonStart <= now && lessonEnd >= now)
                    {
                        status = "In Progress";
                    }
                    else
                    {
                        status = "Upcoming";
                    }

                    // Calculate duration
                    var duration = lessonEnd - lessonStart;
                    var durationText = duration.TotalHours >= 1 
                        ? $"{Math.Floor(duration.TotalHours)}h {duration.Minutes}m"
                        : $"{duration.Minutes}m";

                    bookings.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        StudentId = reader.GetInt32(2),
                        Instrument = reader.GetString(3),
                        LessonType = reader.IsDBNull(4) ? "virtual" : reader.GetString(4),
                        LessonTypeNew = reader.IsDBNull(5) ? "In-Person" : reader.GetString(5),
                        StudentLessonType = reader.IsDBNull(6) ? (string?)null : reader.GetString(6),
                        TimeSlot = timeSlot,
                        StartTime = lessonStart.ToString("yyyy-MM-dd HH:mm"),
                        EndTime = lessonEnd.ToString("yyyy-MM-dd HH:mm"),
                        Duration = durationText,
                        Price = reader.GetDecimal(8), // Fixed: Price is at index 8, not 7
                        Notes = reader.IsDBNull(9) ? "" : reader.GetString(9), // Fixed: Notes is at index 9, not 8
                        TeacherName = reader.IsDBNull(10) ? "Unknown Teacher" : reader.GetString(10), // Fixed: TeacherName is at index 10, not 9
                        TeacherEmail = reader.IsDBNull(11) ? "" : reader.GetString(11), // Fixed: TeacherEmail is at index 11, not 10
                        Status = status,
                        CanCancel = status == "Upcoming" || status == "In Progress",
                        DisplayLessonType = !string.IsNullOrEmpty(reader.IsDBNull(6) ? null : reader.GetString(6)) 
                            ? reader.GetString(6) 
                            : (reader.IsDBNull(5) ? "In-Person" : reader.GetString(5))
                    });
                }

                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/student/profile - Get current user's profile using JWT
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Email, CardNumber, ExpiryDate, Instrument, Pin FROM Students WHERE Email = @email", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Student profile not found" });
                }
                
                var student = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Email = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    CardNumber = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    ExpiryDate = reader.IsDBNull(4) ? "" : reader.GetString(4),
                    Instrument = reader.IsDBNull(5) ? "" : reader.GetString(5),
                    Pin = reader.IsDBNull(6) ? "" : reader.GetString(6)
                };
                
                return Ok(new { success = true, data = student });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/student/profile - Update current user's profile using JWT
        [HttpPut("profile")]
        public IActionResult UpdateProfile([FromBody] UpdateStudentProfileRequest request)
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                if (request == null)
                {
                    return BadRequest(new { success = false, error = "Request body is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if student exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Students WHERE Email = @email", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count == null || Convert.ToInt32(count) == 0)
                {
                    return NotFound(new { success = false, error = "Student profile not found" });
                }

                // Update student (email is read-only, use token email)
                var updateCmd = new SqliteCommand(
                    "UPDATE Students SET Name = @name, CardNumber = @cardNumber, ExpiryDate = @expiryDate, Instrument = @instrument, Pin = @pin WHERE Email = @email",
                    connection);
                
                updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                updateCmd.Parameters.AddWithValue("@cardNumber", request.CardNumber ?? "");
                updateCmd.Parameters.AddWithValue("@expiryDate", request.ExpiryDate ?? "");
                updateCmd.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                updateCmd.Parameters.AddWithValue("@pin", request.Pin ?? "");
                updateCmd.Parameters.AddWithValue("@email", email);
                
                updateCmd.ExecuteNonQuery();

                return Ok(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/student/profile - Delete current user's profile using JWT
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First check if student exists
                var checkCommand = new SqliteCommand("SELECT Id FROM Students WHERE Email = @email", connection);
                checkCommand.Parameters.AddWithValue("@email", email);
                
                using var reader = checkCommand.ExecuteReader();
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Student profile not found" });
                }
                
                var studentId = reader.GetInt32(0);
                reader.Close();

                // Delete any lessons associated with this student
                var deleteLessonsCommand = new SqliteCommand("UPDATE Lessons SET StudentId = NULL WHERE StudentId = @studentId", connection);
                deleteLessonsCommand.Parameters.AddWithValue("@studentId", studentId);
                deleteLessonsCommand.ExecuteNonQuery();

                // Delete the student
                var deleteCommand = new SqliteCommand("DELETE FROM Students WHERE Email = @email", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Student profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Student profile not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/student/profile - Create profile for current user using JWT
        [HttpPost("profile")]
        public IActionResult CreateProfile([FromBody] CreateStudentProfileRequest request)
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
                if (role != "student" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for students and admins." });
                }

                if (request == null || string.IsNullOrEmpty(request.Name))
                {
                    return BadRequest(new { success = false, error = "Name is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if profile already exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Students WHERE Email = @email", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count != null && Convert.ToInt32(count) > 0)
                {
                    return BadRequest(new { success = false, error = "Student profile already exists" });
                }

                var command = new SqliteCommand(
                    "INSERT INTO Students (Name, Email, CardNumber, ExpiryDate, Instrument) VALUES (@name, @email, @cardNumber, @expiryDate, @instrument)",
                    connection);

                command.Parameters.AddWithValue("@name", request.Name);
                command.Parameters.AddWithValue("@email", email); // Use email from JWT token
                command.Parameters.AddWithValue("@cardNumber", request.CardNumber ?? "");
                command.Parameters.AddWithValue("@expiryDate", request.ExpiryDate ?? "");
                command.Parameters.AddWithValue("@instrument", request.Instrument ?? "");

                command.ExecuteNonQuery();

                return Ok(new { success = true, message = "Student profile created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        public class StudentRequest
        {
            public string Name { get; set; } = "";
            public string Email { get; set; } = "";
            public string? CardNumber { get; set; }
            public string? ExpiryDate { get; set; }
            public string? Instrument { get; set; }
            public string? Pin { get; set; }
        }

        public class BookRequest
        {
            public int StudentId { get; set; }
            public int LessonId { get; set; }
        }

        public class CardRequest
        {
            public string CardNumber { get; set; } = "";
            public string ExpiryDate { get; set; } = "";
            public string Pin { get; set; } = "";
        }

        public class UpdateStudentRequest
        {
            public int StudentId { get; set; }
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? CardNumber { get; set; }
            public string? ExpiryDate { get; set; }
            public string? Instrument { get; set; }
            public string? Pin { get; set; }
        }

        public class UpdateStudentProfileRequest
        {
            public string? Name { get; set; }
            public string? CardNumber { get; set; }
            public string? ExpiryDate { get; set; }
            public string? Instrument { get; set; }
            public string? Pin { get; set; }
        }

        public class CreateStudentProfileRequest
        {
            public string Name { get; set; } = "";
            public string? CardNumber { get; set; }
            public string? ExpiryDate { get; set; }
            public string? Instrument { get; set; }
        }

        public class BookLessonRequest
        {
            public int LessonId { get; set; }
            public string? StudentLessonType { get; set; }
            public string? SpecialRequests { get; set; }
            public string? SheetMusicFileName { get; set; }
            public string? SheetMusicFilePath { get; set; }
        }

        public class CancelLessonRequest
        {
            public int LessonId { get; set; }
        }
    }
}
