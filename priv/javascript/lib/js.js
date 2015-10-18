let JS = {
  call_property: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
};

export default JS;
