using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace FreelanceMusic.Services
{
    public class JwtService
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        public JwtService(IConfiguration configuration)
        {
            _secretKey = configuration["Jwt:SecretKey"] ?? "YourSecretKeyForJWTTokenGenerationThatIsAtLeast32CharactersLong!";
            _issuer = configuration["Jwt:Issuer"] ?? "FreelanceMusic";
            _audience = configuration["Jwt:Audience"] ?? "FreelanceMusicUsers";
        }

        public string GenerateToken(int userId, string email, string role)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userId", userId.ToString()),
                new Claim("email", email),
                new Claim("role", role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_secretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                return principal;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public (int userId, string email, string role)? GetUserFromToken(string token)
        {
            var principal = ValidateToken(token);
            if (principal == null) return null;

            var userIdClaim = principal.FindFirst("userId");
            var emailClaim = principal.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") ?? principal.FindFirst("email");
            var roleClaim = principal.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role") ?? principal.FindFirst("role");

            if (userIdClaim == null || emailClaim == null || roleClaim == null) return null;

            if (!int.TryParse(userIdClaim.Value, out int userId)) return null;

            return (userId, emailClaim.Value, roleClaim.Value);
        }
    }
}
