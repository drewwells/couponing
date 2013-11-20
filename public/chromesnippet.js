$(".hdr-container, h2, h1, .offer-type, label").hide(); $("textarea").attr('rows',2);
function focus(){
    $("#domain").focus();
}
$('form').off('submit',focus).on('submit',focus);
$(document,'form input')
  .on('dragenter dragexit dragover',function(){ return false; })
  .on('drop',function(ev){
    ev.stopPropagation();
    if(!ev.originalEvent.dataTransfer){ return false; }
    var offer = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
    //#domain #f_code #f_description #expires
    $("#domain").val(offer.site);
    $("#f_code").val(offer.code);
    $("#f_description").val(offer.description);
    var date = new Date(offer.expires);
    date = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear();
    $("#expires").val(date);
    return false;
  });
''