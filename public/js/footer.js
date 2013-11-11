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