const getRandomBuffer = () => window.crypto.getRandomValues(new Uint8Array(256));

const isValidCharacter = (char: string) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = '0123456789'.split('');

  return [...lowercase, ...uppercase, ...numbers].includes(char);
};

/**
 * Return a string containing random characters generated via web `crypto` API.
 *
 * @see https://deepsource.io/blog/dont-use-math-random/
 */
export const getRandomString = (length = 16) => {
  let result = '';
  let randomBuffer: Uint8Array;

  while (result.length < length) {
    randomBuffer = getRandomBuffer();

    for (let index = 0; index < randomBuffer.length; index++) {
      const char = String.fromCharCode(randomBuffer[index]);

      if (isValidCharacter(char)) {
        result += char;
      }

      if (result.length === length) {
        break;
      }
    }
  }

  return result;
};
