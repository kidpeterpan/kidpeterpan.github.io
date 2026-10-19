+++
title = 'open-mtp-client'
description = 'Android phone not showing up on your Mac? open-mtp-client is a free Mac app that copies files both ways and tells you what is wrong when it can’t connect.'
date = '2026-10-19T00:00:00+07:00'
layout = 'project'
images = ['main.png']

[params]
order = 1
seo_title = 'Free Android File Transfer for Mac | open-mtp-client'
eyebrow = 'Free Mac app'
tagline = 'Copy files between your Mac and your Android phone. When it can’t connect, it tells you what is wrong.'
card_pitch = 'Android phone not showing up on your Mac? This app finds it, or tells you why.'
route_from = 'Android phone'
route_to = 'Mac'
hero_image = 'main.png'
hero_alt = 'open-mtp-client with a phone’s Camera folder full of photos on the right and a Mac Documents folder on the left'
hero_caption = 'Shown with a virtual phone and sample files.'
version = '0.1.0'
repo_url = 'https://github.com/kidpeterpan/open-mtp-client'
license = 'MIT'
os = 'macOS 11 or later'
category = 'UtilitiesApplication'
cta_kind = 'download'
requirements = [
  'macOS 11 or later',
  'A Mac with Apple Silicon or Intel',
  'An Android phone and a USB cable that carries data (some cables only charge)',
]
steps = [
  'Click **Download for Mac** and get the latest `.dmg` file.',
  'Open it and drag **open-mtp-client** onto **Applications**.',
  'Open the app. The first time, follow the steps in the box above.',
  'Plug in your phone and unlock it.',
  'Pull down the notification shade, tap the USB notification and choose **File transfer**.',
  'Quit Android File Transfer if it is running.',
]

[params.cta]
label = 'Download for Mac'
url = 'https://github.com/kidpeterpan/open-mtp-client/releases/latest'

[params.cta_secondary]
label = 'Or build it from source'
url = 'https://github.com/kidpeterpan/open-mtp-client#build-from-source'

[params.notice]
title = 'The first time you open it'
body = '''
macOS will say it can’t check the app for malware. That is because the app is not notarized yet (Apple charges a yearly fee for that). It is safe to open if you downloaded it from the Releases page.

- **macOS 15 or later:** try to open the app, then go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway**.
- **macOS 14 or earlier:** right-click the app, choose **Open**, then **Open** again.

You only do this once.
'''

[[params.faq]]
q = 'My phone doesn’t show up. What do I do?'
a = '''
Check that the cable carries data, the phone is unlocked, and **File transfer** is chosen in the phone’s USB notification. Then quit Android File Transfer. Still stuck? Open **Help → Troubleshooting** in the app. It checks your Mac and tells you what to fix.
'''

[[params.faq]]
q = 'Is it safe?'
a = '''
It is open source under the MIT license, so anyone can read the code. It has no telemetry and no network code. If you would rather not trust a download, you can [build it yourself](https://github.com/kidpeterpan/open-mtp-client#build-from-source). An app you build yourself opens without the macOS warning.
'''

[[params.faq]]
q = 'Does it cost anything?'
a = '''
No. It’s free. If it saved you time, you can [buy me a coffee](https://buymeacoffee.com/kidpeterpan).
'''

[[params.faq]]
q = 'Can I use it from the Terminal?'
a = '''
Yes. The app includes `open-mtp-client-cli` for scripts, for example `open-mtp-client-cli pull /DCIM/Camera ~/Pictures/phone`. Run `open-mtp-client-cli --help` to see everything it can do.
'''
+++

## The problem

Using an Android phone with a Mac is painful:

- **Your phone is invisible.** macOS can’t talk to Android phones, so nothing shows up in Finder.
- **“No device found.”** That’s all you get. No reason, no fix.
- **Other apps steal the phone.** Photos, Image Capture and Android File Transfer grab it first.
- **Copies fail halfway.** Then you start over.
- **Copies can be wrong.** And nobody tells you.

open-mtp-client fixes these. It explains every failure, frees the phone when macOS is in the way, resumes copies and checks every file.

## What it does

- **Tells you why it can’t connect**, with a fix for each cause.
- **Frees your phone** from macOS camera services and other apps that grab it first.
- **Copies both ways** with progress and speed. Pause and resume, even after a lost cable or a restart.
- **Checks every file** before it removes the original. One bad file never stops the rest.
- **Shows your phone and your Mac side by side**, with photo thumbnails, search and sort. Fast with tens of thousands of files.
- **Imports only new photos**, into folders by date.
- **Works with several phones at once**, and handles files over 4 GB and any file name, including emoji and Thai.
- **Feels like a Mac app**: menu bar, Quick Look, drag and drop from Finder, and light and dark themes.
