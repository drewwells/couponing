var ids = $.makeArray($('.submit').map(function(){ return this.id; }));
//console.log(ids)
$('.all').on('click',function(){
    $.ajax({
        url: '/validate',
        data: {
            couponIds: ids
            //couponIds: ['52757da108f8f080fe7b53e6']
        },
        success: function(data){
            window.location.reload(true);
        }
    });
});

$('[draggable]').on('dragstart',function(ev){
    var texts = $(this).find('td').map(function(){
        return this.innerText;
    });
    event.dataTransfer.setData('text/plain',JSON.stringify({
        'site': texts[0],
        'code': texts[1].split(',')[0],
        'description': texts[2],
        'expires': texts[3]
    }));
});