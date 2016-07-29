---
layout: post
title: BIND结合NGINX+PHP实现DNS服务器URL转发
subtitle: 
tags: 
---

前几天在公司分享会偶尔说起DNS,突然提到域名运营商提供的URL转发功能，即将指定的域名转发到相关域名，且可以在地址栏显示或隐藏目标URL。争论了很久，很多同学都认为是DNS服务器自身提供了这个功能。众所周知，DNS服务器只提供域名的解析功能，而URL转发是HTTP范畴，以下详细说明下我自己的实现原理及过程。

# 原理
大多数域名运营商都会提供URL转发(国内此功能需要备案和审核)功能，分显示和隐藏两种。我们在实现的过程中分两个环节，即DNS和HTTP。一个URL转发记录对应DNS服务器两条记录，分别为A或CNAME记录和TXT记录。A或CNAME记录解析到自己的HTTP服务器，以用于后面处理URL转发,这条记录对用户隐藏。TXT记录是用户在操作界面填写的URL转发目标地址和类型。DNS解析完成之后交由HTTP服务器，可以用任何服务端语言编写。

<!--more-->

# 实现过程

## 环境说明
* 操作系统：CentOS 6(Vagrant)
* DNS服务器：BIND-9.8.2 (yum)
* HTTP服务端：NGINX+PHP-FPM-5.3 (yum)
* 测试域名：ninjacn.com

## DNS服务器

DNS服务器由BIND搭建，通过yum直接安装即可。下面截取主要的配置以供大家理解：

### 截取/etc/named.conf 
{% highlight bash %}
options {
        listen-on port 53 { 127.0.0.1; };
        directory       "/var/named";
};
zone "ninjacn.com" IN {
        type master;
        file "ninjacn.com.zone";
};
{% endhighlight %}

### 截取/var/named/ninjacn.com.zone
{% highlight bash %}
$TTL 3H
@	IN SOA	ninjacn.com. root.ninjacn.com. (
					0	; serial
					1D	; refresh
					1H	; retry
					1W	; expire
					3H )	; minimum
	NS	@
	A	127.0.0.1
u0	A	127.0.0.1
u1	A	127.0.0.1
u0	TXT	0|http://www.baidu.com/0.html
u1	TXT	1|http://www.baidu.com/1.html
{% endhighlight %}

共解析2条URL转发（u0和u1），它们的A记录都对应自己的HTTP服务器,TXT记录对应真实的URL转发目标地址信息，TXT记录由2部分组成，由`|`分隔，左边部分为URL类型（显示或隐藏），右边部分为真正的目标地址。

## HTTP服务端

浏览器发起相关域名的请求之后，我们自己的服务器(DNS服务器A记录)会处理这个请求。服务端接受请求后会根据主机头向DNS服务器查询相应的TXT记录，获取到DNS记录之后根据类型(0代表显示URL，1代表隐藏URL)返回HTTP响应信息。

* 当类型为0时，HTTP服务端返回301或302状态码，响应头的Location是具体的URL目标地址。
* 当类型为1时，HTTP服务端返回包含iframe的HTML信息。iframe的src属性为具体的URL目标地址。

具体实现看以下PHP代码。

### Nginx配置文件

泛域名配置,所有请求都会由此server块处理。
{% highlight nginx %}
server {
    listen       80;
    server_name  _;

    location / {
        root   /usr/share/nginx/html;
        index  index.php;
    }
    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  /usr/share/nginx/html$fastcgi_script_name;
        include        fastcgi_params;
    }
}
{% endhighlight %}

### PHP实现转发
{% highlight php %}
<?php
/**
 * @author ninjacn <x@ninjacn.com>
 * 根据获取到的主机名获取相应TXT记录,并返回相应信息
 */

define('TARGET_SHOW', 0); //显示url
define('TARGET_HIDE', 1); //隐藏url

$hostname = $_SERVER['HTTP_HOST'];
$record = dns_get_record($hostname, DNS_TXT);

list($type, $url) = array('', '');
if($record) {
    if(isset($record[0]['txt'])) {
	list($type, $url) = explode('|', $record[0]['txt']);
    }
}

if(empty($type) && empty($url)) {
    exit(110);
}

if($type == TARGET_HIDE) {
    header('Location: '.$url);
} elseif ($type == TARGET_SHOW) {
    $html = "<iframe src='".$url."'></iframe>";
    echo $html;
}
{% endhighlight %}

# 测试

## 显示url - u0.ninjacn.com

HTTP状态码为200，不做转发处理，真正的网页地址在iframe的src属性指定。

{% highlight bash %}
[root@localhost ~]# curl -i u0.ninjacn.com
HTTP/1.1 200 OK
Server: nginx/1.10.1
Date: Thu, 28 Jul 2016 19:31:40 GMT
Content-Type: text/html
Transfer-Encoding: chunked
Connection: keep-alive
X-Powered-By: PHP/5.3.3

<iframe src='http://www.baidu.com/0.html'></iframe>
{% endhighlight %}

## 隐藏URL - u1.ninjacn.com

HTTP状态码为302,目标地址在响应头的Location属性。

{% highlight bash %}
[root@localhost ~]# curl -i u1.ninjacn.com
HTTP/1.1 302 Moved Temporarily
Server: nginx/1.10.1
Date: Thu, 28 Jul 2016 19:36:59 GMT
Content-Type: text/html
Transfer-Encoding: chunked
Connection: keep-alive
X-Powered-By: PHP/5.3.3
Location: http://www.baidu.com/1.html
{% endhighlight %}
