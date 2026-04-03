namespace HotelManagement.Enums
{
    public enum RoomStatus
    {
        Available = 0,
        Occupied = 1,
        Dirty = 2,
        Maintenance = 3,
        OutOfService = 4
    }

    public enum BookingStatus
    {
        Pending = 0,
        Confirmed = 1,
        CheckedIn = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum InvoiceStatus
    {
        Pending = 0,
        Paid = 1,
        Cancelled = 2
    }

    public enum PaymentMethod
    {
        Cash = 0,
        CreditCard = 1,
        BankTransfer = 2,
        Online = 3
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Completed = 1,
        Failed = 2,
        Refunded = 3
    }

    public enum DiscountType
    {
        Percentage = 0,
        Fixed = 1
    }

    public enum MealPlan
    {
        RoomOnly = 0,
        BreakfastIncluded = 1,
        HalfBoard = 2,
        FullBoard = 3
    }

    public enum HousekeepingTaskType
    {
        Cleaning = 0,
        Maintenance = 1,
        Inspection = 2
    }

    public enum HousekeepingTaskStatus
    {
        Pending = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }

    public enum TaskPriority
    {
        Low = 0,
        Medium = 1,
        High = 2
    }

    public enum IdType
    {
        CCCD = 0,
        Passport = 1,
        Other = 2
    }
}
