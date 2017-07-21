function warn(message) {
  const messageString = message.join('');
  console.warn(`warning: ${messageString}`);

  return Symbol.for('ok');
}

export default {
  warn
};
