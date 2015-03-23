var request = require('request');

module.exports = function(query, callback){
	var url = this.url + 'search?q='+ query;
    request(url, function(error, res, body){
        if (error) {
            callback(error);
        }else{
            callback(null, body);
        }
    });
};