function join(arg, extra = null) {
  const components = Array.isArray(arg) ? arg : [arg, extra];
  let names = [];
  for (let i = components.length - 1; i >= 0; i--) {
    const name = components[i];
    const normalized_name = name.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    names.push(normalized_name);
    if (name[0] === '/') {
      names.push('');
      break;
    }
  }
  return names.reverse().join('/');
}

function dirname(arg) {
  const path = join([arg]);
  const index = path.lastIndexOf('/');
  return index === -1 ? '.' : (path.substr(0, index) || '/');
}

export default {
  join,
  dirname,
};
