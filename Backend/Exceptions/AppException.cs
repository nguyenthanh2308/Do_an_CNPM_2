namespace HotelManagement.Exceptions
{
    /// <summary>
    /// Exception cho lỗi nghiệp vụ (400 Bad Request)
    /// </summary>
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public List<string> Errors { get; }

        public AppException(string message, int statusCode = 400)
            : base(message)
        {
            StatusCode = statusCode;
            Errors = new List<string> { message };
        }

        public AppException(List<string> errors, int statusCode = 400)
            : base(string.Join("; ", errors))
        {
            StatusCode = statusCode;
            Errors = errors;
        }

        public static AppException NotFound(string resource) =>
            new($"{resource} không tìm thấy.", 404);

        public static AppException Conflict(string message) =>
            new(message, 409);

        public static AppException Forbidden(string message) =>
            new(message, 403);

        public static AppException Validation(List<string> errors) =>
            new(errors, 422);
    }
}
