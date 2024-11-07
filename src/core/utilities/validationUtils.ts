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
 * Checks the parameter to see if it can be converted into a number and if so, follows the rules of what is a valid ISBN number.
 *
 * @param {String} isbn the value to check
 * @returns true if the parameter is a number and is a valid ISBN number
 */
 function isISBNProvided(isbn: string): boolean {
    if(isbn.length != 10 && isbn.length != 13) {
        return false;
    }

    if (isbn.length === 10) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          const digit = parseInt(isbn[i], 10);
          if (isNaN(digit)) {
            return false;
          }
          sum += digit * (10 - i);
        }
    
        const lastDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9], 10);
        if (isNaN(lastDigit)) {
          return false;
        }
        return (sum + lastDigit) % 11 === 0;
      } else {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(isbn[i], 10);
          if (isNaN(digit)) {
            return false;
          }
          sum += (i % 2 === 0 ? 1 : 3) * digit;
        }
    
        const checkDigit = 10 - (sum % 10);
        return checkDigit === parseInt(isbn[12], 10);
      }
}

// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any

const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    isISBNProvided,
};

export { validationFunctions };
