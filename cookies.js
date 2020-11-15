
// converts a sting containing netscape cookies to an Array
function Netscape2Cookies(text) {

  
    var cookies = [];
    var lines = text.split("\n");
 
    // iterate over lines
    lines.forEach(function(line, index){
        
        var tokens = line.split("\t");
 
        // we only care for valid cookie def lines
        if (tokens.length == 7) {
 
            // trim the tokens
            tokens = tokens.map(function(e){return e.trim();});
 
            var cookie = {};
 
            // Extract the data
            cookie.domain = tokens[0];
            cookie.flag = tokens[1] === 'TRUE';
            cookie.path = tokens[2];
            cookie.secure = tokens[3] === 'TRUE';
 
            // Convert date to a readable format
            
            var timestamp = tokens[4];
            if (timestamp.length == 17){
            	timestamp = Math.floor(timestamp / 1000000 - 11644473600);
            }
            
            cookie.expiration = timestamp;
 
            cookie.name = tokens[5];
            cookie.value = tokens[6];
 
            // Record the cookie.
            cookies.push(cookie);
        }    
    });
    
    return cookies;
}
