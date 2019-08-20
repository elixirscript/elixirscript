/* The purpose of this module is, in fact, to do IO. */
/* eslint-disable no-console */
import erlang from './erlang';

function put_chars(ioDevice, charData) {
  const dataToWrite = erlang.iolist_to_binary(charData);

  if (ioDevice === Symbol.for('stderr')) {
    console.error(dataToWrite);
  } else {
    console.log(dataToWrite);
  }

  return Symbol.for('ok');
}

export default {
  put_chars,
};
