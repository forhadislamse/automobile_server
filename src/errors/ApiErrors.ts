interface IErrorDetail {
  field?: string;
  message: string;
}

class ApiError extends Error {
  statusCode: number;
  errorDetails?: IErrorDetail[];

  constructor(
    statusCode: number,
    message: string | undefined,
    errorDetails?: IErrorDetail[] | string,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;

    // Handle both string and array of error details
    if (errorDetails) {
      if (typeof errorDetails === "string") {
        this.errorDetails = [{ message: errorDetails }];
      } else {
        this.errorDetails = errorDetails;
      }
    }

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
