import Kernel from './kernel';

//https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_2_%E2%80%93_rewrite_the_DOMs_atob()_and_btoa()_using_JavaScript's_TypedArrays_and_UTF-8
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function encode64(data){
  return b64EncodeUnicode(data);
}

function decode64(data){
  try{
    return Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom("ok"), atob(data));
  }catch(e){
    return Kernel.SpecialForms.atom("error");
  }

  return btoa(data);
}

function decode64__em__(data){
  return atob(data);
}


export default {
  encode64,
  decode64,
  decode64__em__
}
