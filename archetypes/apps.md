+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = '{{ .Date }}'
draft = true
description = 'หนึ่งบรรทัดว่าแอปนี้ใช้ทำอะไร'
tags = ['tools']
[params]
order = 99
icon = '🔧'
app_js = '{{ .File.ContentBaseName }}.js'
+++