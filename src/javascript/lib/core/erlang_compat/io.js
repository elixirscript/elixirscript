function put_chars(ioDevice, charData) {
  let dataToWrite = null;

  if (Array.isArray(charData)) {
    dataToWrite = String.fromCodePoint(...charData);
  } else {
    dataToWrite = charData;
  }

  if (ioDevice === Symbol.for('stderr')) {
    console.error(dataToWrite);
  } else {
    console.log(dataToWrite);
  }

  return Symbol.for('ok');
}

export default {
  put_chars
};
