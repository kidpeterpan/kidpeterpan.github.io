+++
title = 'open-mtp-client'
description = 'Android 폰이 Mac에 보이지 않나요? open-mtp-client는 파일을 양방향으로 복사하고, 연결되지 않을 때는 무엇이 문제인지 알려 주는 무료 Mac 앱입니다.'
date = '2026-10-19T00:00:00+07:00'
layout = 'project'

[params]
seo_title = '무료 Mac용 Android 파일 전송 앱 | open-mtp-client'
eyebrow = '무료 Mac 앱'
tagline = 'Mac과 Android 폰 사이에서 파일을 복사하세요. 연결되지 않을 때는 무엇이 문제인지 알려 줍니다.'
card_pitch = 'Android 폰이 Mac에 보이지 않나요? 이 앱이 폰을 찾아내거나, 못 찾는 이유를 알려 줍니다.'
route_from = 'Android 폰'
route_to = 'Mac'
hero_alt = 'open-mtp-client: 오른쪽에는 사진이 가득한 폰의 Camera 폴더, 왼쪽에는 Mac의 Documents 폴더'
hero_caption = '가상 폰과 샘플 파일로 표시한 화면입니다.'
requirements = [
  'macOS 11 이상',
  'Apple 실리콘 또는 Intel Mac',
  'Android 폰과 데이터 전송이 되는 USB 케이블 (충전만 되는 케이블도 있습니다)',
]
steps = [
  '**Mac용 다운로드**를 눌러 최신 `.dmg` 파일을 받습니다.',
  '파일을 열고 **open-mtp-client**를 **Applications**로 끌어다 놓습니다.',
  '앱을 엽니다. 처음에는 위 상자의 안내를 따라 주세요.',
  '폰을 연결하고 잠금을 해제합니다.',
  '알림 창을 아래로 내리고 USB 알림을 눌러 **File transfer** (파일 전송)를 선택합니다.',
  'Android File Transfer가 실행 중이면 종료합니다.',
]

[params.cta]
label = 'Mac용 다운로드'

[params.cta_secondary]
label = '또는 소스에서 직접 빌드하기'

[params.notice]
title = '처음 열 때'
body = '''
macOS가 앱의 악성 코드 여부를 확인할 수 없다고 알립니다. 아직 앱이 공증(notarize)되지 않았기 때문입니다(Apple은 공증에 연간 비용을 받습니다). Releases 페이지에서 내려받았다면 안전하게 열어도 됩니다.

- **macOS 15 이상:** 앱을 열려고 시도한 뒤 **System Settings → Privacy & Security** (시스템 설정 → 개인정보 보호 및 보안)로 가서 아래로 스크롤하고 **Open Anyway** (그래도 열기)를 누릅니다.
- **macOS 14 이하:** 앱을 우클릭하고 **Open**을 선택한 다음, 한 번 더 **Open**을 누릅니다.

이 과정은 한 번만 하면 됩니다.
'''

[[params.faq]]
q = '폰이 보이지 않아요. 어떻게 해야 하나요?'
a = '''
케이블이 데이터 전송을 지원하는지, 폰의 잠금이 풀려 있는지, 폰의 USB 알림에서 **File transfer**가 선택되어 있는지 확인하세요. 그런 다음 Android File Transfer를 종료합니다. 그래도 안 되나요? 앱에서 **Help → Troubleshooting**을 여세요. Mac을 점검하고 무엇을 고쳐야 하는지 알려 줍니다.
'''

[[params.faq]]
q = '안전한가요?'
a = '''
MIT 라이선스의 오픈 소스이므로 누구나 코드를 읽을 수 있습니다. 텔레메트리도, 네트워크 코드도 없습니다. 내려받은 파일을 믿고 싶지 않다면 [직접 빌드](https://github.com/kidpeterpan/open-mtp-client#build-from-source)할 수 있습니다. 직접 빌드한 앱은 macOS 경고 없이 열립니다.
'''

[[params.faq]]
q = '비용이 드나요?'
a = '''
아니요, 무료입니다. 도움이 되었다면 [커피 한 잔 사주세요](https://buymeacoffee.com/kidpeterpan).
'''

[[params.faq]]
q = '터미널에서도 쓸 수 있나요?'
a = '''
네. 앱에는 스크립트용 `open-mtp-client-cli`가 들어 있습니다. 예를 들면 `open-mtp-client-cli pull /DCIM/Camera ~/Pictures/phone` 처럼 씁니다. `open-mtp-client-cli --help`를 실행하면 할 수 있는 모든 일을 볼 수 있습니다.
'''
+++

## 문제

Android 폰을 Mac에서 쓰는 일은 번거롭습니다.

- **폰이 보이지 않습니다.** macOS는 Android 폰과 통신하지 못하므로 Finder에 아무것도 나타나지 않습니다.
- **“No device found.”** 알려 주는 건 이 한 줄뿐입니다. 이유도, 해결 방법도 없습니다.
- **다른 앱이 폰을 가로챕니다.** Photos, Image Capture, Android File Transfer가 먼저 폰을 붙잡습니다.
- **복사가 중간에 실패합니다.** 그러면 처음부터 다시 시작해야 합니다.
- **복사본이 잘못될 수 있습니다.** 그런데 아무도 알려 주지 않습니다.

open-mtp-client가 이 문제들을 해결합니다. 모든 실패의 이유를 설명하고, macOS가 방해할 때 폰을 풀어 주고, 복사를 이어서 할 수 있게 하며, 모든 파일을 검증합니다.

## 할 수 있는 일

- **연결되지 않는 이유를 알려 줍니다.** 원인마다 해결 방법도 함께 보여 줍니다.
- **폰을 해방합니다.** macOS의 카메라 서비스와, 먼저 폰을 붙잡는 다른 앱으로부터 풀어 줍니다.
- **양방향으로 복사합니다.** 진행률과 속도를 보여 주고, 케이블이 빠지거나 재시작한 뒤에도 일시 중지하고 이어서 할 수 있습니다.
- **원본을 지우기 전에 모든 파일을 검증합니다.** 문제가 있는 파일 하나가 나머지를 멈추게 하지 않습니다.
- **폰과 Mac을 나란히 보여 줍니다.** 사진 미리보기, 검색, 정렬을 지원하며 수만 개의 파일에도 빠릅니다.
- **새 사진만 가져옵니다.** 날짜별 폴더로 정리합니다.
- **여러 대의 폰을 동시에 사용합니다.** 4 GB가 넘는 파일과 이모지, 태국어를 포함한 모든 파일 이름을 처리합니다.
- **내 언어로 씁니다.** 영어, 태국어, 일본어, 중국어 간체. 설정에서 고르거나 Mac의 언어를 따르게 할 수 있습니다.
- **Mac 앱처럼 쓸 수 있습니다.** 메뉴 막대, Quick Look, Finder에서 끌어다 놓기, 밝은 테마와 어두운 테마를 지원합니다.
