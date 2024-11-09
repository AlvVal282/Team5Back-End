/**
 * Checks the parameter to see if it is a a String.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String0, false otherwise
 */
function isString(candidate: any): candidate is string {
    return typeof candidate === 'string';
}

/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
function isStringProvided(candidate: any): boolean {
    return isString(candidate) && candidate.length > 0;
}

/**
 * Checks the parameter to see if it can be converted into a number.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a number, false otherwise
 */
function isNumberProvided(candidate: any): boolean {
    return (
        isNumber(candidate) ||
        (candidate != null &&
            candidate != '' &&
            !isNaN(Number(candidate.toString())))
    );
}

/**
 * Helper
 * @param x data value to check the type of
 * @returns true if the type of x is a number, false otherise
 */
function isNumber(x: any): x is number {
    return typeof x === 'number';
}
/**
 * 
 * @param str a value to check
 * @returns true if the type of str only contains alphabetical characters or spaces, false otherwise
 */
function isAlphabetical(str: string): boolean {
    const alphabeticalRegex = /^[a-zA-Z\s]+$/;
    return alphabeticalRegex.test(str);
}
/**
 * Checks the parameter to see if it can be converted into a number and if so, greater than -1.
 *
 * @param {String} candidate the value to check
 * @returns true if the parameter is a number and a non-negative, false otherwise
 */
function isAuthorOrYearProvided(candidate: string): boolean {
    const num = parseFloat(candidate);
    return (
        (isNumber(candidate) 
            || (candidate != null 
            && candidate != '' 
            && !isNaN(Number(candidate.toString()))))
        && num >=  0
    );
}
/**
 * Checks the parameter to see if it can be converted into a number and if so, follows the rules of what is a valid ISBN number.
 *
 * @param {String} isbn the value to check
 * @returns true if the parameter is a number and is a valid ISBN number
 */
function isValidISBN13(isbn: String): boolean {
    return isbn.length === 13;
}


/**
 * 
 * @param {String} password 
 * @returns true if the password passed through has at least one Uppercase letter, lowercase letter, a number as well as a special character
 *          The password must also be of length greater than 7
 */
function isValidPassword(password: string): boolean {
    const minLength = 8;
    if (password.length < minLength) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * 
 * @param {String} phone 
 * @returns true if the phone has exactly 10 numerical digits and if the string was provided
 */
function isValidPhone(phone: string): boolean {
    return isStringProvided(phone) && /^\d{10}$/.test(phone);
}

/**
 * 
 * @param {String} priority 
 * @returns true if the role is 1 <= role <= 5 and its a numerical digit
 */
function isValidRole(priority: string): boolean {
    return isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;
}
/**
 * 
 * @param {String} email 
 * @returns true if the email matches the pattern, emailPattern, and the string is provided
 */
function isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return isStringProvided(email) && emailPattern.test(email);
}

// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any

const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidRole,
    isAuthorOrYearProvided,
    isValidISBN13,
    isAlphabetical
};

export { validationFunctions };
