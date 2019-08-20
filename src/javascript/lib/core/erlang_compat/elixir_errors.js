/* It is far too "meta" to warn about including a warning in a warning */
/* eslint-disable no-console */

function warn(message) {
  const messageString = message.join('');
  console.warn(`warning: ${messageString}`);


  return Symbol.for('ok');
}

export default {
  warn,
};
