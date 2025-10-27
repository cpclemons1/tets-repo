using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using FreelanceMusic.Services;

namespace FreelanceMusic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeacherController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=database.db";
        private readonly JwtService _jwtService;

        public TeacherController(JwtService jwtService)
        {
            _jwtService = jwtService;
        }

        // POST /api/teacher/create
        [HttpPost("create")]
        public IActionResult CreateTeacher([FromBody] TeacherRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Instrument))
                {
                    return BadRequest(new { success = false, error = "Name and Instrument are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    "INSERT INTO Teachers (Name, Instrument, Email, HourlyRate, Availability) VALUES (@name, @instrument, @email, @hourlyRate, @availability)",
                    connection);

                command.Parameters.AddWithValue("@name", request.Name);
                command.Parameters.AddWithValue("@instrument", request.Instrument);
                command.Parameters.AddWithValue("@email", request.Email ?? "");
                command.Parameters.AddWithValue("@hourlyRate", request.HourlyRate > 0 ? request.HourlyRate : 50.0);
                command.Parameters.AddWithValue("@availability", request.Availability ?? "");

                command.ExecuteNonQuery();

                return Ok(new { success = true, message = "Teacher created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/teacher/{id}
        [HttpGet("{id}")]
        public IActionResult GetTeacher(int id)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Email, Instrument, HourlyRate, Availability FROM Teachers WHERE Id = @id", connection);
                command.Parameters.AddWithValue("@id", id);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Teacher not found" });
                }
                
                var teacher = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Email = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    Instrument = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    HourlyRate = reader.IsDBNull(4) ? 0.0 : reader.GetDouble(4),
                    Availability = reader.IsDBNull(5) ? "" : reader.GetString(5)
                };
                
                return Ok(new { success = true, data = teacher });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/teacher/update-profile
        [HttpPut("update-profile")]
        public IActionResult UpdateProfile([FromBody] UpdateTeacherRequest request)
        {
            try
            {
                if (request == null || request.TeacherId == 0)
                {
                    return BadRequest(new { success = false, error = "TeacherId is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if teacher exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Teachers WHERE Id = @id", connection);
                checkCmd.Parameters.AddWithValue("@id", request.TeacherId);
                var count = checkCmd.ExecuteScalar();
                
                if (count == null || Convert.ToInt32(count) == 0)
                {
                    return NotFound(new { success = false, error = "Teacher not found" });
                }

                // Update teacher
                var updateCmd = new SqliteCommand(
                    "UPDATE Teachers SET Name = @name, Email = @email, Instrument = @instrument, HourlyRate = @hourlyRate, Availability = @availability WHERE Id = @id",
                    connection);
                
                updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                updateCmd.Parameters.AddWithValue("@email", request.Email ?? "");
                updateCmd.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                updateCmd.Parameters.AddWithValue("@hourlyRate", request.HourlyRate > 0 ? request.HourlyRate : 50.0);
                updateCmd.Parameters.AddWithValue("@availability", request.Availability ?? "");
                updateCmd.Parameters.AddWithValue("@id", request.TeacherId);
                
                updateCmd.ExecuteNonQuery();

                return Ok(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/teacher/students
        [HttpGet("students")]
        public IActionResult GetStudents()
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Email FROM Students ORDER BY Name", connection);
                using var reader = command.ExecuteReader();

                var students = new List<object>();
                while (reader.Read())
                {
                    students.Add(new
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Email = reader.GetString(2)
                    });
                }

                return Ok(new { success = true, data = students });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/teacher/lessons/{id}
        [HttpPut("lessons/{id}")]
        public IActionResult UpdateLesson(int id, [FromBody] ScheduleRequest request)
        {
            try
            {
                if (request == null || request.TeacherId == 0 || string.IsNullOrEmpty(request.StartTime) || string.IsNullOrEmpty(request.EndTime))
                {
                    return BadRequest(new { success = false, error = "TeacherId, StartTime, and EndTime are required" });
                }

                // Validate that start time is before end time
                if (DateTime.TryParse(request.StartTime, out DateTime startTime) && 
                    DateTime.TryParse(request.EndTime, out DateTime endTime))
                {
                    if (startTime >= endTime)
                    {
                        return BadRequest(new { success = false, error = "Start time must be before end time" });
                    }
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if lesson exists and belongs to the teacher
                var checkCommand = new SqliteCommand(
                    "SELECT TeacherId FROM Lessons WHERE Id = @id",
                    connection);
                checkCommand.Parameters.AddWithValue("@id", id);
                
                var existingTeacherId = checkCommand.ExecuteScalar();
                if (existingTeacherId == null)
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }
                
                if (Convert.ToInt32(existingTeacherId) != request.TeacherId)
                {
                    return StatusCode(403, new { success = false, error = "You can only update your own lessons" });
                }

                var command = new SqliteCommand(
                    "UPDATE Lessons SET StudentId = @studentId, Instrument = @instrument, LessonType = @lessonType, TimeSlot = @timeSlot, Price = @price, Notes = @notes WHERE Id = @id",
                    connection);

                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@studentId", request.StudentId ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                command.Parameters.AddWithValue("@lessonType", request.LessonType ?? "virtual");
                command.Parameters.AddWithValue("@timeSlot", $"{request.StartTime} - {request.EndTime}");
                command.Parameters.AddWithValue("@price", request.Price > 0 ? request.Price : 50.0);
                command.Parameters.AddWithValue("@notes", request.Notes ?? "");

                int rowsAffected = command.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Lesson updated successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Lesson not found or no changes made" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/teacher/lessons/{id}
        [HttpDelete("lessons/{id}")]
        public IActionResult DeleteLesson(int id)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if lesson exists and get details
                var checkCommand = new SqliteCommand(
                    "SELECT TeacherId, StudentId FROM Lessons WHERE Id = @id",
                    connection);
                checkCommand.Parameters.AddWithValue("@id", id);
                
                using var reader = checkCommand.ExecuteReader();
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }

                var teacherId = reader.GetInt32(0);
                var studentId = reader.IsDBNull(1) ? (int?)null : reader.GetInt32(1);
                reader.Close();

                // Log cancellation for admin reporting if lesson was booked
                if (studentId.HasValue)
                {
                    var logCommand = new SqliteCommand(
                        "INSERT INTO CancellationLog (LessonId, StudentId, CancelledAt, Reason) VALUES (@lessonId, @studentId, @cancelledAt, @reason)",
                        connection);
                    logCommand.Parameters.AddWithValue("@lessonId", id);
                    logCommand.Parameters.AddWithValue("@studentId", studentId.Value);
                    logCommand.Parameters.AddWithValue("@cancelledAt", DateTime.UtcNow);
                    logCommand.Parameters.AddWithValue("@reason", "Teacher deletion");
                    logCommand.ExecuteNonQuery();
                }

                var command = new SqliteCommand(
                    "DELETE FROM Lessons WHERE Id = @id",
                    connection);
                command.Parameters.AddWithValue("@id", id);

                int rowsAffected = command.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Lesson deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Lesson not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
        [HttpPost("schedule")]
        public IActionResult ScheduleLesson([FromBody] ScheduleRequest request)
        {
            try
            {
                if (request == null || request.TeacherId == 0 || string.IsNullOrEmpty(request.StartTime) || string.IsNullOrEmpty(request.EndTime))
                {
                    return BadRequest(new { success = false, error = "TeacherId, StartTime, and EndTime are required" });
                }

                // Validate lesson type
                if (string.IsNullOrEmpty(request.LessonTypeNew))
                {
                    return BadRequest(new { success = false, error = "Lesson Type is required" });
                }

                if (!new[] { "In-Person", "Virtual", "Student Preference" }.Contains(request.LessonTypeNew))
                {
                    return BadRequest(new { success = false, error = "Lesson Type must be 'In-Person', 'Virtual', or 'Student Preference'" });
                }

                // Validate that start time is before end time
                if (DateTime.TryParse(request.StartTime, out DateTime startTime) && 
                    DateTime.TryParse(request.EndTime, out DateTime endTime))
                {
                    if (startTime >= endTime)
                    {
                        return BadRequest(new { success = false, error = "Start time must be before end time" });
                    }
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    "INSERT INTO Lessons (TeacherId, StudentId, Instrument, LessonType, lesson_type, TimeSlot, Price, Notes) VALUES (@teacherId, @studentId, @instrument, @lessonType, @lessonTypeNew, @timeSlot, @price, @notes); SELECT last_insert_rowid();",
                    connection);

                command.Parameters.AddWithValue("@teacherId", request.TeacherId);
                command.Parameters.AddWithValue("@studentId", request.StudentId ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                command.Parameters.AddWithValue("@lessonType", request.LessonType ?? "virtual");
                command.Parameters.AddWithValue("@lessonTypeNew", request.LessonTypeNew);
                command.Parameters.AddWithValue("@timeSlot", $"{request.StartTime} - {request.EndTime}");
                command.Parameters.AddWithValue("@price", request.Price > 0 ? request.Price : 50.0);
                command.Parameters.AddWithValue("@notes", request.Notes ?? "");

                var lessonId = command.ExecuteScalar();
                
                // Get the created lesson with teacher details
                var getLessonCommand = new SqliteCommand(
                    @"SELECT l.Id, l.TeacherId, l.StudentId, l.Instrument, l.LessonType, l.lesson_type, l.student_lesson_type, l.TimeSlot, l.Price, l.Notes,
                             t.Name as TeacherName, t.Email as TeacherEmail
                      FROM Lessons l 
                      LEFT JOIN Teachers t ON l.TeacherId = t.Id 
                      WHERE l.Id = @lessonId",
                    connection);
                getLessonCommand.Parameters.AddWithValue("@lessonId", lessonId);
                
                using var reader = getLessonCommand.ExecuteReader();
                if (reader.Read())
                {
                    var createdLesson = new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        StudentId = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2),
                        Instrument = reader.GetString(3),
                        LessonType = reader.IsDBNull(4) ? "virtual" : reader.GetString(4),
                        LessonTypeNew = reader.IsDBNull(5) ? "In-Person" : reader.GetString(5),
                        StudentLessonType = reader.IsDBNull(6) ? (string?)null : reader.GetString(6),
                        TimeSlot = reader.GetString(7),
                        Price = reader.GetDecimal(8),
                        Notes = reader.IsDBNull(9) ? "" : reader.GetString(9),
                        TeacherName = reader.IsDBNull(10) ? "Unknown Teacher" : reader.GetString(10),
                        TeacherEmail = reader.IsDBNull(11) ? "" : reader.GetString(11)
                    };
                    
                    return Ok(new { success = true, message = "Lesson scheduled successfully", data = createdLesson });
                }
                
                return Ok(new { success = true, message = "Lesson scheduled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/teacher/availability
        [HttpPost("availability")]
        public IActionResult SetAvailability([FromBody] AvailabilityRequest request)
        {
            try
            {
                if (request == null || request.TeacherId == 0 || request.TimeSlots == null || request.TimeSlots.Count == 0)
                {
                    return BadRequest(new { success = false, error = "TeacherId and TimeSlots are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var insertedCount = 0;
                foreach (var timeSlot in request.TimeSlots)
                {
                    // Check if time slot already exists
                    var checkCmd = new SqliteCommand(
                        "SELECT COUNT(*) FROM Lessons WHERE TeacherId = @teacherId AND TimeSlot = @timeSlot AND StudentId IS NULL",
                        connection);
                    checkCmd.Parameters.AddWithValue("@teacherId", request.TeacherId);
                    checkCmd.Parameters.AddWithValue("@timeSlot", timeSlot);
                    var exists = Convert.ToInt32(checkCmd.ExecuteScalar()) > 0;

                    if (!exists)
                    {
                        var command = new SqliteCommand(
                            "INSERT INTO Lessons (TeacherId, Instrument, LessonType, TimeSlot, Price) VALUES (@teacherId, @instrument, @lessonType, @timeSlot, @price)",
                            connection);

                        command.Parameters.AddWithValue("@teacherId", request.TeacherId);
                        command.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                        command.Parameters.AddWithValue("@lessonType", "both");
                        command.Parameters.AddWithValue("@timeSlot", timeSlot);
                        command.Parameters.AddWithValue("@price", request.Price);

                        command.ExecuteNonQuery();
                        insertedCount++;
                    }
                }

                return Ok(new { success = true, message = $"{insertedCount} availability slots added successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/teacher/bookings
        [HttpGet("bookings")]
        public IActionResult GetBookings([FromQuery] int teacherId)
        {
            try
            {
                if (teacherId == 0)
                {
                    return BadRequest(new { success = false, error = "TeacherId is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand(
                    "SELECT l.Id, l.TeacherId, l.StudentId, l.Instrument, l.LessonType, l.TimeSlot, l.Price, l.Notes, s.Name as StudentName FROM Lessons l LEFT JOIN Students s ON l.StudentId = s.Id WHERE l.TeacherId = @teacherId ORDER BY l.TimeSlot DESC",
                    connection);

                command.Parameters.AddWithValue("@teacherId", teacherId);
                using var reader = command.ExecuteReader();

                var bookings = new List<object>();
                while (reader.Read())
                {
                    int? studentIdValue = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
                    bookings.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        StudentId = studentIdValue,
                        Instrument = reader.GetString(3),
                        LessonType = reader.IsDBNull(4) ? "both" : reader.GetString(4),
                        TimeSlot = reader.GetString(5),
                        Price = reader.GetDecimal(6),
                        Notes = reader.IsDBNull(7) ? "" : reader.GetString(7),
                        StudentName = reader.IsDBNull(8) ? null : reader.GetString(8),
                        Status = "Booked"
                    });
                }

                return Ok(new { success = true, data = bookings });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/teacher/lessons (all lessons for a teacher including unscheduled)
        [HttpGet("lessons")]
        public IActionResult GetTeacherLessons()
        {
            try
            {
                // Get teacher info from JWT token
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
                if (role != "teacher" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for teachers and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First, verify the teacher exists in the database
                var teacherCheckCommand = new SqliteCommand(
                    "SELECT Id FROM Teachers WHERE Email = @email",
                    connection);
                teacherCheckCommand.Parameters.AddWithValue("@email", email);
                
                using var teacherReader = teacherCheckCommand.ExecuteReader();
                if (!teacherReader.Read())
                {
                    return BadRequest(new { success = false, error = "Teacher profile not found. Please create a profile first." });
                }
                
                int teacherId = teacherReader.GetInt32(0);
                teacherReader.Close();

                var command = new SqliteCommand(
                    "SELECT l.Id, l.TeacherId, l.StudentId, l.Instrument, l.LessonType, l.lesson_type, l.student_lesson_type, l.TimeSlot, l.Price, l.Notes, l.SpecialRequests, l.SheetMusicFileName, l.SheetMusicFilePath, s.Name as StudentName, t.Name as TeacherName FROM Lessons l LEFT JOIN Students s ON l.StudentId = s.Id LEFT JOIN Teachers t ON l.TeacherId = t.Id WHERE l.TeacherId = @teacherId ORDER BY l.TimeSlot DESC",
                    connection);

                command.Parameters.AddWithValue("@teacherId", teacherId);
                using var reader = command.ExecuteReader();

                var lessons = new List<object>();
                while (reader.Read())
                {
                    int? studentIdValue = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
                    lessons.Add(new
                    {
                        Id = reader.GetInt32(0),
                        TeacherId = reader.GetInt32(1),
                        StudentId = studentIdValue,
                        Instrument = reader.GetString(3),
                        LessonType = reader.IsDBNull(4) ? "virtual" : reader.GetString(4),
                        LessonTypeNew = reader.IsDBNull(5) ? "In-Person" : reader.GetString(5),
                        StudentLessonType = reader.IsDBNull(6) ? (string?)null : reader.GetString(6),
                        TimeSlot = reader.GetString(7),
                        Price = reader.GetDecimal(8),
                        Notes = reader.IsDBNull(9) ? "" : reader.GetString(9),
                        SpecialRequests = reader.IsDBNull(10) ? "" : reader.GetString(10),
                        SheetMusicFileName = reader.IsDBNull(11) ? "" : reader.GetString(11),
                        SheetMusicFilePath = reader.IsDBNull(12) ? "" : reader.GetString(12),
                        StudentName = reader.IsDBNull(13) ? null : reader.GetString(13),
                        TeacherName = reader.IsDBNull(14) ? "Unknown Teacher" : reader.GetString(14),
                        Status = studentIdValue.HasValue ? "Booked" : "Available",
                        DisplayLessonType = studentIdValue.HasValue && !string.IsNullOrEmpty(reader.IsDBNull(6) ? null : reader.GetString(6)) 
                            ? reader.GetString(6) 
                            : (reader.IsDBNull(5) ? "In-Person" : reader.GetString(5))
                    });
                }

                return Ok(new { success = true, data = lessons });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // GET /api/teacher/by-email/{email}
        [HttpGet("by-email/{email}")]
        public IActionResult GetTeacherByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Instrument, Email, HourlyRate, Availability FROM Teachers WHERE Email = @email", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Teacher not found" });
                }
                
                var teacher = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Instrument = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    Email = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    HourlyRate = reader.IsDBNull(4) ? 0.0 : reader.GetDouble(4),
                    Availability = reader.IsDBNull(5) ? "" : reader.GetString(5)
                };
                
                return Ok(new { success = true, data = teacher });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/teacher/by-email/{email}
        [HttpDelete("by-email/{email}")]
        public IActionResult DeleteTeacherByEmail(string email)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First check if teacher exists
                var checkCommand = new SqliteCommand("SELECT Id FROM Teachers WHERE Email = @email", connection);
                checkCommand.Parameters.AddWithValue("@email", email);
                
                using var reader = checkCommand.ExecuteReader();
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Teacher not found" });
                }
                
                var teacherId = reader.GetInt32(0);
                reader.Close();

                // Delete any lessons associated with this teacher
                var deleteLessonsCommand = new SqliteCommand("DELETE FROM Lessons WHERE TeacherId = @teacherId", connection);
                deleteLessonsCommand.Parameters.AddWithValue("@teacherId", teacherId);
                deleteLessonsCommand.ExecuteNonQuery();

                // Delete the teacher
                var deleteCommand = new SqliteCommand("DELETE FROM Teachers WHERE Email = @email", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Teacher profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Teacher not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // ==================== JWT-Based Profile Endpoints ====================

        // GET /api/teacher/profile - Get current user's profile using JWT
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
                if (role != "teacher" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for teachers and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                var command = new SqliteCommand("SELECT Id, Name, Instrument, Email, HourlyRate, Availability FROM Teachers WHERE Email = @email", connection);
                command.Parameters.AddWithValue("@email", email);
                
                using var reader = command.ExecuteReader();
                
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Teacher profile not found" });
                }
                
                var teacher = new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Instrument = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    Email = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    HourlyRate = reader.IsDBNull(4) ? 0.0 : reader.GetDouble(4),
                    Availability = reader.IsDBNull(5) ? "" : reader.GetString(5)
                };
                
                return Ok(new { success = true, data = teacher });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // PUT /api/teacher/profile - Update current user's profile using JWT
        [HttpPut("profile")]
        public IActionResult UpdateProfile([FromBody] UpdateTeacherProfileRequest request)
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
                if (role != "teacher" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for teachers and admins." });
                }

                if (request == null)
                {
                    return BadRequest(new { success = false, error = "Request body is required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if teacher exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Teachers WHERE Email = @email", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count == null || Convert.ToInt32(count) == 0)
                {
                    return NotFound(new { success = false, error = "Teacher profile not found" });
                }

                // Update teacher (email is read-only, use token email)
                var updateCmd = new SqliteCommand(
                    "UPDATE Teachers SET Name = @name, Instrument = @instrument, HourlyRate = @hourlyRate, Availability = @availability WHERE Email = @email",
                    connection);
                
                updateCmd.Parameters.AddWithValue("@name", request.Name ?? "");
                updateCmd.Parameters.AddWithValue("@instrument", request.Instrument ?? "");
                updateCmd.Parameters.AddWithValue("@hourlyRate", request.HourlyRate > 0 ? request.HourlyRate : 50.0);
                updateCmd.Parameters.AddWithValue("@availability", request.Availability ?? "");
                updateCmd.Parameters.AddWithValue("@email", email);
                
                updateCmd.ExecuteNonQuery();

                return Ok(new { success = true, message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // DELETE /api/teacher/profile - Delete current user's profile using JWT
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
                if (role != "teacher" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for teachers and admins." });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // First check if teacher exists
                var checkCommand = new SqliteCommand("SELECT Id FROM Teachers WHERE Email = @email", connection);
                checkCommand.Parameters.AddWithValue("@email", email);
                
                using var reader = checkCommand.ExecuteReader();
                if (!reader.Read())
                {
                    return NotFound(new { success = false, error = "Teacher profile not found" });
                }
                
                var teacherId = reader.GetInt32(0);
                reader.Close();

                // Delete any lessons associated with this teacher
                var deleteLessonsCommand = new SqliteCommand("DELETE FROM Lessons WHERE TeacherId = @teacherId", connection);
                deleteLessonsCommand.Parameters.AddWithValue("@teacherId", teacherId);
                deleteLessonsCommand.ExecuteNonQuery();

                // Delete the teacher
                var deleteCommand = new SqliteCommand("DELETE FROM Teachers WHERE Email = @email", connection);
                deleteCommand.Parameters.AddWithValue("@email", email);
                
                int rowsAffected = deleteCommand.ExecuteNonQuery();
                
                if (rowsAffected > 0)
                {
                    return Ok(new { success = true, message = "Teacher profile deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, error = "Teacher profile not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // POST /api/teacher/profile - Create profile for current user using JWT
        [HttpPost("profile")]
        public IActionResult CreateProfile([FromBody] CreateTeacherProfileRequest request)
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
                if (role != "teacher" && role != "admin")
                {
                    return StatusCode(403, new { success = false, error = "Access denied. This endpoint is only for teachers and admins." });
                }

                if (request == null || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Instrument))
                {
                    return BadRequest(new { success = false, error = "Name and Instrument are required" });
                }

                using var connection = new SqliteConnection(_connectionString);
                connection.Open();

                // Check if profile already exists
                var checkCmd = new SqliteCommand("SELECT COUNT(*) FROM Teachers WHERE Email = @email", connection);
                checkCmd.Parameters.AddWithValue("@email", email);
                var count = checkCmd.ExecuteScalar();
                
                if (count != null && Convert.ToInt32(count) > 0)
                {
                    return BadRequest(new { success = false, error = "Teacher profile already exists" });
                }

                var command = new SqliteCommand(
                    "INSERT INTO Teachers (Name, Instrument, Email, HourlyRate, Availability) VALUES (@name, @instrument, @email, @hourlyRate, @availability)",
                    connection);

                command.Parameters.AddWithValue("@name", request.Name);
                command.Parameters.AddWithValue("@instrument", request.Instrument);
                command.Parameters.AddWithValue("@email", email); // Use email from JWT token
                command.Parameters.AddWithValue("@hourlyRate", request.HourlyRate > 0 ? request.HourlyRate : 50.0);
                command.Parameters.AddWithValue("@availability", request.Availability ?? "");

                command.ExecuteNonQuery();

                return Ok(new { success = true, message = "Teacher profile created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        public class TeacherRequest
        {
            public string Name { get; set; } = "";
            public string Instrument { get; set; } = "";
            public string? Email { get; set; }
            public double HourlyRate { get; set; }
            public string? Availability { get; set; }
        }

        public class ScheduleRequest
        {
            public int TeacherId { get; set; }
            public string StartTime { get; set; } = "";
            public string EndTime { get; set; } = "";
            public string? Instrument { get; set; }
            public int? StudentId { get; set; }
            public string LessonType { get; set; } = "virtual";
            public string LessonTypeNew { get; set; } = "";
            public double Price { get; set; }
            public string? Notes { get; set; }
        }

        public class AvailabilityRequest
        {
            public int TeacherId { get; set; }
            public string Instrument { get; set; } = "";
            public List<string> TimeSlots { get; set; } = new List<string>();
            public double Price { get; set; }
        }

        public class UpdateTeacherRequest
        {
            public int TeacherId { get; set; }
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? Instrument { get; set; }
            public double HourlyRate { get; set; }
            public string? Availability { get; set; }
        }

        public class UpdateTeacherProfileRequest
        {
            public string? Name { get; set; }
            public string? Instrument { get; set; }
            public double HourlyRate { get; set; }
            public string? Availability { get; set; }
        }

        public class CreateTeacherProfileRequest
        {
            public string Name { get; set; } = "";
            public string Instrument { get; set; } = "";
            public double HourlyRate { get; set; }
            public string? Availability { get; set; }
        }
    }
}
