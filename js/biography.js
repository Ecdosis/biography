(function ($) {
/**
 * Remove any &lt;p&gt; and &lt;br&gt; codes at start and end
 * And wrap the text in a single &lt;p&gt; and &lt;/p&gt; pair
 * @param text the raw HTML fragment
 * @return kosher HTML wrapped in a single &lt;p&gt;
 */
function normaliseParagraph( text )
{
    var re = new RegExp("^ | $|^<br>|^<p>|<\/p>$|<br>$","g");
    var rep = text;
    text = "";
    while ( rep != text )
    {
        text = rep;
        rep = text.replace(re,"");
    }
    rep = "<p>"+rep+"</p>";
    return $.htmlClean(rep, {format:true});
}
function parseJSON( json )
{
    return JSON && JSON.parse(json) || $.parseJSON(json);
}
/**
 * Create a year entry in the biography
 * @param curr_year the current year as a number
 * @param body the body of the biography, minus refs
 * @param refs the references for the body
 */
function pasteYear( curr_year, body, refs )
{
    var html = '<div class="year"><h3>'+curr_year.toString()+'</h3>';
    html += '<div class="bio">';
    html += body;
    html += "</div>\n";
    if ( refs.length>0 )
    {
        html += '<div class="references">';
        html += refs;
        html += '</div>';
    }
    html += "</div>\n";
    return html;
}
/**
 * Sort an array with string keys
 * @param arr array to sort
 */
function sortEvents( arr )
{
    var incs = new Array( 1391376, 463792, 198768, 86961, 33936,
        13776, 4592, 1968, 861, 336,
        112, 48, 21, 7, 3, 1 );
    for ( var k=0; k<16; k++)
    {
        var i,lim = arr.length-1;
        for ( var h=incs[k],i=h;i<=lim;i++ )
        {
            v = arr[i];
            var j = i;
            var da = new FuzzyDate(arr[j-h].startDate);
            var dv = new FuzzyDate(v.startDate);
            while (j >= h && da.compareTo(dv)>0 )
            {
                arr[j] = arr[j-h];
                j -= h;
                if ( j>=h )
                    da = new FuzzyDate(arr[j-h].startDate);
            }
            arr[j] = v;
        }
    }
}
function hideFrom( head )
{
    var shown = 0;
    $("div.year h3").each(function() {
        if ( $(this).text()==head )
        {
            shown = $(this).parent().offset().top;
            $(this).parent().show();
            shown += $(this).parent().height();
        }
        else if ( shown > 0 && ($(this).parent().height()+shown <= $(window).height()) )
        {
            $(this).parent().show();
            shown += $(this).parent().height();
            if ( shown > $(window).height() )
                $(this).parent().hide();
        }
        else
        {
            $(this).parent().hide();
        }
    });
}
function rawToReal( year )
{
    var realYear = year;
    $("div.year h3").each(function() 
    {
        var text = $(this).text();
        if ( text.indexOf("–")!= -1 )
            text = text.substring(text.indexOf("–")+1);
        else if ( text.indexOf("-")!= -1 )
            text = text.substring(text.indexOf("-")+1);
        if ( text <= year )
            realYear = $(this).text();
    });
    return realYear;
}
function httpGet(theUrl)
{
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    if ( xmlHttp.readyState==1 )
        xmlHttp.send( null );
    return xmlHttp.responseText;
}
function buildYearDropDown( jsObject )
{
    var dates = jsObject.timeline.date;
    var dropdown = $("#year_dropdown");
    var years = new Array();
    var i = 0;
    for ( i=0;i<dates.length;i++ )
    {
        var year = dates[i].startDate.split(",");
        if ( years.length==0 || (year.length==3 && years[years.length-1]!=year[0]) )
            years.push(year[0]);
    }
    for ( i=0;i<years.length;i++ )
    {
        var otext = (i==0)?"<option selected>":"<option>";
        otext += years[i];
        otext += "</option>";
        var option = $(otext); 
        dropdown.append(option);
    }
}
$(function(){
    var url = "http://dev.austese.net/json/timeline/";
    var value = $('#event_type').val();
    url += "?event_type="+value;
    var dataObject = httpGet(url);
    if ( dataObject != null )
    {
        var width = $("#timeline").width()-43;
        var height = (width*2)/3
        var jsObject = eval("("+dataObject+")");
        var parent_config = { type: 'timeline', width: width, height: height, source: jsObject, embed_id: 'my_timeline' };
        buildYearDropDown(jsObject);
        createStoryJS( parent_config );
    }
    $(function() {
        $('#event_type').change(function() {
            this.form.submit();
        });
    });
    $("#tabs").tabs({
        active: 0
    });
    $("#tabs").tabs({
        activate: function(event,ui) {
            if ( ui.newPanel.selector=="#biography" )
            {
                if ( ui.newPanel.has("div.year").length==0 )
                {
                    var bUrl = $("#biography_docid").val();
                    if ( bUrl != undefined )
                    {
                        var html = "";
                        var json = httpGet(bUrl);
                        if ( json != null && json.length > 0 )
                        {
                            var jdoc = parseJSON( json );
                            var bio = $("#biography").add("<!--aese:0-->'");
                            var refs = "";
                            var body = "";
                            var arr = jdoc.results;
                            sortEvents( arr );
                            var prev_year = 0;
                            var curr_year = 0;
                            for ( var i=0;i<arr.length;i++ )
                            {
                                var obj = arr[i];
                                var date = new FuzzyDate(obj.startDate);
                                curr_year = date.getYear();
                                if ( curr_year != prev_year && prev_year != 0 )
                                {
                                    html += pasteYear( prev_year, body, refs );
                                    body = refs = "";
                                }
                                if ( body.length>0 )
                                    body += " ";
                                body += normaliseParagraph(obj.description);
                                if ( refs.length>0 )
                                    refs += " ";
                                refs += normaliseParagraph(obj.references);
                                prev_year = curr_year;
                            }
                            if ( body.length>0 )
                                html += pasteYear(curr_year,body,refs);
                            $("#biography").append(html);        
                            // animate pictures
                            $("a.corpix").click(function(){
                                var parent = $(this).parent();
                                if ( parent.prev().is("img") )
                                    parent.prev().remove();
                                else
                                {
                                    var url = $(this).attr("title");
                                    var alt = $(this).data("alt");
                                    if ( alt == undefined )
                                        alt="click to remove";
                                    parent.before("<img title=\""+alt+"\" src=\""+url+"\">");
                                    parent.prev().click(function(){
                                        $(this).remove();
                                    });
                                 }
                            });
                        }
                    }
                }
            }
        }
    });
});
})(jQuery); // end of dollar namespace



