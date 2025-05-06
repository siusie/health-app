function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password should be at least ${minLength} characters long`,
    };
  }

  if (!hasUpperCase) {
    return {
      valid: false,
      message: 'Password should contain at least one uppercase letter',
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: 'Password should contain at least one lowercase letter',
    };
  }

  if (!hasNumbers) {
    return {
      valid: false,
      message: 'Password should contain at least one number',
    };
  }

  if (!hasSpecialChars) {
    return {
      valid: false,
      message: 'Password should contain at least one special character',
    };
  }

  return {
    valid: true,
    message: 'Password is valid',
  };
}

module.exports = validatePassword;
