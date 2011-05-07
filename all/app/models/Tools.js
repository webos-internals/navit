/**
 * Convert number of bytes into human readable format
 *
 * @param integer bytes     Number of bytes to convert
 * @param integer precision Number of digits after the decimal separator
 * @return string
 */
function bytesToSize(bytes, precision){
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
    
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
        
    }
    else 
        if ((bytes >= kilobyte) && (bytes < megabyte)) {
            return (bytes / kilobyte).toFixed(precision) + ' KiB';
            
        }
        else 
            if ((bytes >= megabyte) && (bytes < gigabyte)) {
                return (bytes / megabyte).toFixed(precision) + ' MiB';
                
            }
            else 
                if ((bytes >= gigabyte) && (bytes < terabyte)) {
                    return (bytes / gigabyte).toFixed(precision) + ' GiB';
                    
                }
                else 
                    if (bytes >= terabyte) {
                        return (bytes / terabyte).toFixed(precision) + ' TiB';
                        
                    }
                    else {
                        return bytes + ' B';
                    }
}
