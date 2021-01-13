## curl.js - curl replacment to download dynamic web pages with puppeteer

`Curl.js` is a drop in replacement for curl, using pupeteer (chromium) to download html
code of web pages composed with javascript. It supports many curl options and provides
additional options to deal with dynmic stuff.

### Getting Started

 Save the file `curl.js` to a directory and install puppeteer: 

	wget https://raw.githubusercontent.com/gnadelwartz/puppet-curl/master/curl.js
	npm install puppeteer

 Making `curl.js` executeable on Linux/Unix/BSD system allow run it without typing node everytime.

 (c) 2020 gnadelwartz kay@rrr.de

 Released to the public domain where applicable.
 Otherwise, it is released under the terms of the WTFPLv2

### Usage

 	[node] curl.js [--wait s] [--max-time s] [--proxy|--socks[45] host[:port]] [curl_opt] URL

		--wait <s> - wait seconds to finally render page between load and output (curl.js)

		-m|--max-time seconds - timeout, default 30s
		-X|--proxy <host[:port]> - http proxy
		--socks4|--socks4a <host[:port]> - socks version 4 proxy
		--socks5|--socks5-hostname  <host[:port]> - socks version 5 proxy
		-A|--user-agent <agent-string>
		-e|--referer <URL>
		-k|--insecure - allow insecure SSL connections
		-o|--output <file> - write html to file
		--create-dirs - create path to file named by -o
		-b|--cookie <file> - raed cookies from file
		-c|--cookie--jar <file> - write cookies to file
		-s|--silent - no error messages etc.
		--noproxy <no-proxy-list> - comma seperated domain/ip list
		-w|--write-out %{url_effective}|%{http_code} - final URL and or response code'
		-L - follow redirects, always on
		--compressed - decompress zipped data transfers, always on
		-i|--include - include headers in output
		-D|--dump-header - dump headers to file

		--chromearg - add chromium command line arg (curl.js), see
	                      https://peter.sh/experiments/chromium-command-line-switches/

		--click CSS/xPath - click on first element matching CSS/xPath expression (curl.js)
	                            multiple "--click" options will be processed in given order
		--screenshot file - takes a screenshot and save to file, format jpep or png (curl.js)
		--timeout|--conect-timeout seconds - alias for --max-time

		-h|--help - show all options


 Other curl otions are currently not implemented and ignored. Thus you can make GET requests in an URL, but PUSH requests and data/form
 upload is currently not supported. FTP may never supported.

 Note: `curl.js` always follows redirects, like curl with `-L|--location`. If you want to see/trace all http redirects you must use curl.

 Note2: Cookie files written by `curl.js -c|--cookie-jar` uses JSON format and are not compatible with Curl/Wget/Netscape cookie file format.
 `curl.js -b|--cookie` is able to read both file formats.
 


### default values

```javascript
  var timeout = 30000;
  var wait = 1;

  var pupargs = {
	args:[
		'--bswi', // disable as many as possible for a small foot print
		'--single-process',
		'--no-first-run',
		'--disable.gpu',
		'--no-zygote',
		'--no-sandbox',  
		'--incognito', // use inkonito mode
		//'--proxy-server=socks5://localhost:1080', // in case you want a default proxy
		//'--windows-size=1200,100000' // big window to load as may as posible content
	],
	headless: true
  };

  var pageargs = {
	 waitUntil: 'load'
	 };
```


### Examples

#### Follow dynamic redirects

Modern websites started to execute rediects with Javascript or similar instead of using the location header
defined in HTTP protocol. It's not possible to follow these type of redirects with `curl` or `wget`.

```bash
########
# example for not working redirect with curl
$ curl -sL -w "%{url_effective}" -o /dev/null https://www.dealdoktor.de/goto/deal/361908/; echo
https://www.dealdoktor.de/goto/deal/361908/

# redirect works with  curls.js
$ curl.js -sL --wait 2 -w "%{url_effective}" -o /dev/null https://www.dealdoktor.de/goto/deal/361908/; echo
https://www.amazon.de/dp/B07PDHSPYD
```
 
#### Get dynamic content after clicking on an element

Web applications often loads content when you click on an element without changing the URL.
`Curl` and `wget` can download the regular content, but not the dynamically loaded content.

`Curl.js` not only can download dynamic content,  it's also possible to
specify a series of elements to click on one by one to simulate user interaction.

Elements are specifed as `CSS` or `xPath` selectors, strings starting with `/` are xPath selectors.
Use e.g. Chrome dev tools to [find and test selectors](https://yizeng.me/2014/03/23/evaluate-and-validate-xpath-css-selectors-in-chrome-developer-tools/)

Example: Click Elements on Amazon.de to trigger dynamic content.

```bash
#########
# curl can access overview only, even with changed URL as shown in browser
$ curl -sL --compressed "https://www.amazon.de/?node=18801940031" >offers.html
$ curl -sL --compressed "https://www.amazon.de/b/?node=18801940031&gb_f_deals1=sortOrder:BY_SCORE,dealTypes:LIGHTNING_DEAL&...." >lightning.html


#########
# curl.js loads dynamic content, e.g. LIGHTNING_DEAL  (-L --compressed always on)
$ curls.js -s --wait 2 "https://www.amazon.de/b/?node=18801940031" >offers.html 
$ curls.js -s --wait 2 "https://www.amazon.de/b/?node=18801940031" --click "//div[@data-value=\"LIGHTNING_DEAL\"]" >lightning.html 


# series of 2 clicks to load LIGHTNING_DEAL with minimum 50% savings
$ curls.js -sL --wait 2 "https://www.amazon.de/b/?node=18801940031"\
		--click "//div[@data-value=\"LIGHTNING_DEAL\"]" --click "//div[@data-value=\"50-\"]" >lightning50+.html 
```

### Update puppeteer

Update puppeteer once a while to get the latest security fixes and improvements.
To update puppeteer go to the directory where you saved `curl.js` and execute the following command:

```bash
  npm update puppeteer
```

Instead installing a local copy you can also use a global (system wide) installed puppeteer.
In this case you have to rely on the administrators to update puppeteer.

To check if a global installation is availible execute the folloing command:

```bash
  npm list -g puppeteer || echo "no global installation"
```

### Convert Cookies

`cookies.js` converts Netscape/Curl/Wget cookies file from Netscape to JSON format and output to STDOUT.

	usage: node cookies.js <curl-wget-cookie-file> 
