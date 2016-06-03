//依赖模块
var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require('mkdirp');

//目标网址
var host = 'http://oa.ap.mot-solutions.com';
var url = 
//'http://oa.ap.mot-solutions.com/StaffOrgChart/StaffOrgDept?DeptId=963e1f46-99ed-4776-8a01-38f9d0973dbf';
//'http://oa.ap.mot-solutions.com/StaffOrgChart/StaffOrgDept?DeptId=2a07fef8-c9fe-464b-b74c-591f6a42d9ac';
//'http://oa.ap.mot-solutions.com/StaffOrgChart/StaffOrgDept?DeptId=ca58c56e-6eb6-4fe0-8839-8da7881ba033';
'http://oa.ap.mot-solutions.com/StaffOrgChart/StaffOrgDept?DeptId=8cf8d3d2-279b-458e-a37e-9710388ce70e';


//本地存储目录
var dir = 'd:/a';

//创建目录
mkdirp(dir, function(err) {
	if (err) {
		console.log(err);
	}
});


//发送请求
request(url, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		var $ = cheerio.load(body);
		$('img').each(function(i, e) {
			var src = $(e).attr('src');
			
			var link = $(e).parent().attr("href");
			if(link)
			{
				n = link.split("=");
				m = src.split(".");

				filename = n[1]+'.'+ m[1];
				console.log('download ' + src);
				console.log('as ' + filename );

				download(host + src, dir, filename);
				//console.log('done');
			}
			
			

		});
	}
});

//下载方法
var download = function(url, dir, filename) {
	request.head(url, function(err, res, body) {
		request(url).pipe(fs.createWriteStream(dir + "/" + filename));
	});
};


