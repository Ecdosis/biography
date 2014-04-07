String.prototype.isAlNum = function() {
  var regExp = /^[A-Za-z0-9]+$/;
  return (this.match(regExp));
};
String.prototype.isAlpha = function() {
  var regExp = /^[A-Za-z]+$/;
  return (this.match(regExp));
};
String.prototype.isDigit = function() {
  var regExp = /^[0-9]+$/;
  return (this.match(regExp));
};
FuzzyDate.month_values = new Array();
FuzzyDate.approx_terms = new Array();
FuzzyDate.ERROR = -2;
FuzzyDate.UNSET = -3;
FuzzyDate.month_values['en'] = {"january":0,"jan":0,"february":1,"feb":1,
    "march":2,"mar":2,"april":3,"apr":3,"jun":5,"jul":6,"aug":7,"sept":8,
    "oct":9,"nov":10,"dec":11,"may":4,"june":5,"july":6,"august":7,
    "september":8,"october":9,"november":10,"december":11};
FuzzyDate.month_values['it'] = {"gennaio":0,"genn":0,"febbraio":1,"febbr":1,
    "marzo":2,"mar":2,"aprile":3,"apr":3,"maggio":4,"magg":4,"ag":7,
    "sett":8,"ott":9,"nov":10,"dic":11,"giugno":5,"luglio":6,"agosto":7,
    "settembre":8,"ottobre":9,"novembre":10,"dicembre":11};
FuzzyDate.month_values['de'] = {"jan":0,"jän":0,"feb":1,"märz":2,"apr":3,"mai":4,
    "juni":5,"juli":6,"aug":7,"sept":8,"okt":9,"nov":10,"dez":11,"januar":0,
    "februar":1,"märz":2,"april":3,"august":7,"september":8,"oktober":9,"november":10,
    "dezember":11};
FuzzyDate.month_values['es'] = {"enero":0,"feb":1,"marzo":2,"abr":3,
    "mayo":4,"jun":5,"jul":6,"agosto":7,"sept":8,"set":9,"oct":9,"nov":10,
    "dic":11,"febrero":1,"abril":3,"junio":5,"julio":6,"septiembre":8,
    "setiembre":8,"octubre":9,"noviembre":10,"diciembre":11};
FuzzyDate.month_values['fr'] = {"janv":0,"févr":1,"mars":2,"avril":3,
    "mai":4,"juin":5,"juil":6,"août":7,"sept":8,"oct":9,"nov":10,"déc":11,
    "janvier":0,"février":1,"juillet":6,"septembre":8,"octobre":9,"novembre":10,
    "décembre":11};
FuzzyDate.approx_terms['en'] = {"c.":-1,"early":-1,"ca.":-1,"circa":-1,"late":32,
    "by":-1,"from":-1};
FuzzyDate.approx_terms['it'] = {"ca":-1,"primo":-1,"ca.":-1,"circa":-1,"tardo":32,
    "entro":-1,"da":-1};
FuzzyDate.approx_terms['de'] = {"früh":-1,"ca.":-1,"circa":-1,"ende":32,
    "bis":-1,"von":-1};
FuzzyDate.approx_terms['es'] = {"c.":-1,"primero":-1,"circa":-1,"tarde":32,
    "antes de":-1,"desde":-1};
FuzzyDate.approx_terms['fr'] = {"c.":-1,"début de":-1,"circa":-1,"fin de":32,
    "avant":-1,"depuis":-1};
/**
 * Parse a full fuzzy date
 * @param date the fuzzy date expression
 * @param lang the desired language code or nothing
 * @return a fuzzy date object
 */
function FuzzyDate( date, lang )
{
    var day;
    var month;
    var year;
    var LANG;
    date = date.trim();
    if ( lang == undefined )
        LANG = navigator.language.split("-")[0];
    else
        LANG = lang;
    /**
     * Normalise date component: to lower, no punctuation, if digits no letters
     * @param comp the date component
     * @return the component, cleaned
     */
    var clean_component = function( comp ){
        var lc = comp.toLowerCase();
        // remove punctuation
        lc = lc.replace("/[\.\?;:'\"-!\(\)]/", "");
        // remove letters IF it contains digits (and no spaces)
        if ( lc.isAlNum() && !lc.isAlpha() && !lc.isDigit() )
            lc = lc.replace("/[^0-9]/","");
        return lc;
    }
    /**
     * Parse an expression that is either a month name, abbreviation or approximation
     * @param m the text of the "month"
     */
    var parseMonth = function parseMonth( m ){
        var lc = clean_component(m);
        if ( FuzzyDate.approx_terms[LANG][lc] != undefined )
            month = FuzzyDate.approx_terms[LANG][lc];
        else if ( FuzzyDate.month_values[LANG][lc] != undefined )
            month = FuzzyDate.month_values[LANG][lc];
        else
            month = FuzzyDate.ERROR;
    }
    /**
     * Parse a day number or approximation term
     * @param d the day or approximation term
     */
    var parseDay = function( d ){
        var lc = clean_component(d);
        if ( FuzzyDate.approx_terms[LANG][lc] != undefined )
            day = FuzzyDate.approx_terms[LANG][lc];
        else
            day = parseInt(day);
    }
    this.getYear = function(){
        return year;
    }
    this.getMonth = function(){
        return month;
    }
    this.getDay = function(){
        return day;
    }
    year = month = day = FuzzyDate.UNSET;
    var parts = date.split(" ");
    if ( parts.length>0 )
        year = parts[parts.length-1];
    if ( parts.length>1 )
        parseMonth(parts[parts.length-2]);
    var pos;
    if ( month == FuzzyDate.ERROR )
        pos = 1;
    else
        pos = 2;
    var first="";
    // allow day/month approximations of more than one word
    for ( var i=0;i<parts.length-pos;i++ )
    {
        if (first.length>0 )
            first +=" ";
        first += parts[i];
    }
    if ( first.length>0 )
    {
        if ( month == FuzzyDate.ERROR )
            parseMonth(first);
        parseDay(first);
    }
    /**
     * Print a date object on the commandline
     */
    var printDate = function(){
        var str = "";
        if ( day != undefined )
            str += "day="+day+"\n";
        if ( month != undefined )
            str += "month="+month+"\n";
        if ( year != undefined )
            str += "year="+year+"\n";
    }
    var findKeyForValue = function ( arr, val ){
        for ( var key in arr )
        {
            if ( arr[key] == val )
            {
                return key;
            }
        }
        return "";
    }
    /**
     * Convert this numerical date to a string
     * @return a string representation of the fuzzy date
     */
    this.toString = function(){
        var d = year.toString();
        if ( month != FuzzyDate.UNSET )
        {
            if ( month < 0 || month > 31 )
            {
                var str = findKeyForValue(FuzzyDate.approx_terms[LANG],month);
                if ( strlen(str)>0 )
                    d = str+" "+d;
            }
            else
            {
                var key = findKeyForValue(FuzzyDate.month_values[LANG],month);
                if ( key.length>0 )
                    d = key+" "+d;
                if ( day != FuzzyDate.UNSET )
                {
                    if ( day < 0 || day > 31 )
                    {
                        key = findKeyForValue(FuzzyDate.approx_terms[LANG],day);
                        if ( key.length>0 )
                            d = key+" "+d;
                    }
                }
            }
        }
        return d;
    }
    /**
     * Compare ourself to another fuzzy date object
     * @param other the second date
     * @return -1 if we < other, 1 if we > other else 0
     */
    this.compareTo = function( other ){
        if ( year < other.getYear() )
            return -1;
        else if ( year > other.getYear() )
            return 1;
        else if ( month < other.getMonth() )
            return -1;
        else if ( month > other.getMonth() )
            return 1;
        else if ( day < other.getDay() )
            return -1;
        else if ( day > other.getDay() )
            return 1;
        else
            return 0;
    }
}

