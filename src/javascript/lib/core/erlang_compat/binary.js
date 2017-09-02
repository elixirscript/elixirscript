import erlang from './erlang';

function copy(subject, n = 1) {
  return subject.repeat(n);
}

function list_to_bin(bytelist) {
  return erlang.list_to_binary(bytelist);
}

export default {
  copy,
  list_to_bin,
};
