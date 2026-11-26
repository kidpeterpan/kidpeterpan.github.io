+++
title = 'open-mtp-client'
description = 'Android 手机在 Mac 上找不到？open-mtp-client 是一款免费的 Mac 应用，可以双向复制文件，连接不上时还会告诉你问题出在哪。'
date = '2026-10-19T00:00:00+07:00'
layout = 'project'

[params]
seo_title = '免费的 Mac 版 Android 文件传输工具 | open-mtp-client'
eyebrow = '免费 Mac 应用'
tagline = '在 Mac 和 Android 手机之间复制文件。连接不上时，它会告诉你哪里出了问题。'
card_pitch = 'Android 手机在 Mac 上不显示？这个应用能找到它，或者告诉你原因。'
route_from = 'Android 手机'
route_to = 'Mac'
hero_alt = 'open-mtp-client：右侧是手机的 Camera 文件夹，里面满是照片；左侧是 Mac 的 Documents 文件夹'
hero_caption = '截图使用虚拟手机和示例文件。'
requirements = [
  'macOS 11 或更高版本',
  '搭载 Apple 芯片或 Intel 处理器的 Mac',
  'Android 手机，以及能传输数据的 USB 线（有些线只能充电）',
]
steps = [
  '点击 **下载 Mac 版**，获取最新的 `.dmg` 文件。',
  '打开它，把 **open-mtp-client** 拖到 **Applications** 文件夹。',
  '打开应用。第一次打开时，请按上方方框里的步骤操作。',
  '插上手机并解锁。',
  '下拉通知栏，点按 USB 通知，选择 **File transfer**（文件传输）。',
  '如果 Android File Transfer 正在运行，请先退出它。',
]

[params.cta]
label = '下载 Mac 版'

[params.cta_secondary]
label = '或者自己从源码构建'

[params.notice]
title = '第一次打开时'
body = '''
macOS 会提示无法检查该应用是否含有恶意软件。这是因为应用还没有经过公证（Apple 每年要收取费用）。只要你是从 Releases 页面下载的，就可以放心打开。

- **macOS 15 或更高版本：** 先尝试打开应用，然后进入 **System Settings → Privacy & Security**（系统设置 → 隐私与安全性），向下滚动并点击 **Open Anyway**（仍要打开）。
- **macOS 14 或更早版本：** 右键点击应用，选择 **Open**，再点一次 **Open**。

只需要做这一次。
'''

[[params.faq]]
q = '我的手机没有显示出来，怎么办？'
a = '''
请确认数据线能传输数据、手机已解锁，并且在手机的 USB 通知里选择了 **File transfer**。然后退出 Android File Transfer。还是不行？在应用里打开 **Help → Troubleshooting**，它会检查你的 Mac，并告诉你该修什么。
'''

[[params.faq]]
q = '安全吗？'
a = '''
它以 MIT 许可证开源，任何人都可以阅读代码。它没有遥测，也没有联网代码。如果你不想信任下载的文件，可以[自己构建](https://github.com/kidpeterpan/open-mtp-client#build-from-source)。自己构建的应用打开时不会出现 macOS 的警告。
'''

[[params.faq]]
q = '要花钱吗？'
a = '''
不用，它是免费的。如果它帮你节省了时间，可以[请我喝杯咖啡](https://buymeacoffee.com/kidpeterpan)。
'''

[[params.faq]]
q = '能在终端里使用吗？'
a = '''
可以。应用自带 `open-mtp-client-cli`，可用于脚本，例如 `open-mtp-client-cli pull /DCIM/Camera ~/Pictures/phone`。运行 `open-mtp-client-cli --help` 查看它能做的所有事情。
'''
+++

## 问题

在 Mac 上使用 Android 手机很折腾：

- **手机根本看不见。** macOS 无法与 Android 手机通信，所以 Finder 里什么都不会出现。
- **“No device found.”** 你只会得到这一句，没有原因，也没有解决办法。
- **其他应用抢占手机。** Photos、Image Capture 和 Android File Transfer 会先把手机占住。
- **复制到一半失败。** 然后只能从头再来。
- **复制出来的文件可能是错的。** 而且没有人告诉你。

open-mtp-client 解决这些问题。它会解释每一次失败，在 macOS 挡路时释放手机，可以续传复制，并检查每一个文件。

## 它能做什么

- **告诉你为什么连接不上**，并为每种原因给出解决办法。
- **释放你的手机**，不再被 macOS 的相机服务和其他抢先占用它的应用卡住。
- **双向复制**，显示进度和速度。可以暂停和继续，即使数据线被拔掉或电脑重启也没问题。
- **删除原文件之前，先检查每一个文件。** 一个坏文件不会拖住其他文件。
- **并排显示手机和 Mac**，带照片缩略图、搜索和排序。即使有几万个文件也很快。
- **只导入新照片**，按日期放进文件夹。
- **同时使用多部手机**，支持超过 4 GB 的文件和任何文件名，包括表情符号和泰语。
- **说你的语言**：英语、泰语、日语或简体中文。在设置中选择，或者跟随你的 Mac。
- **用起来像 Mac 应用**：菜单栏、Quick Look、从 Finder 拖放，以及浅色和深色主题。
