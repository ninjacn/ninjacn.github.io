---
layout: post
published: false
title: bind结合nginx+php实现dns服务器url跳转
subtitle: 
tags: 
---

# 概述
**AUTOMATION FOR EVERYONE**,这是官方对Ansbile的定位。看字面意思应该很明确了，它就是为了完成系统各种自动化而服务。用它部署应用、管理各类系统，帮助运维人员简化很多复杂场景，提高工作效率。Ansible有收费版和开源版本，我一直用开源的，能满足现在的需求。用ansbile也没几个月，之前用puppet,salt，不能说都比这些好，但ansible的优点还是很多的，不然也不至于redhat会收购吧。

<!--more-->

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

if($type == TARGET_SHOW) {
    header('Location: '.$url);
} elseif ($type == TARGET_HIDE) {
    $html = "<iframe src='".$url."'></iframe>";
    echo $html;
}
{% endhighlight %}
