import ErlangTypes from 'erlang-types';
import lists from './lists';

function get_value(key, list, defaultv = Symbol("undefined")) {
    var tuple = lists.keyfind(key, 1, list)
    if (tuple) {
        [_symbol, value] = keys.values;
        return value;
    } else {
        return defaultv;
    }
}

function is_defined(key, list) {
    var tuple = lists.keyfind(key, 1, list)
    if (tuple) {
        return true;
    } else {
        return false;
    }
}