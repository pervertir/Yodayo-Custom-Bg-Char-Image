# Yodayo-Custom-Chat-Background-And-Image-TamperMonkey-Script
 Allows user to change the background image of Yodayo Chats to any image and remember the setting for each chat.


# Requirements

## Tamper Monkey/ Greasy Monkey
Install from: [Tamper Monkey](https://www.tampermonkey.net/)

## Get the script and enable
Paste this link in your browser, the script should auto install and update: 
```
https://github.com/pervertir/Yodayo-Custom-Bg-Char-Image/raw/main/YodayoChatBgAndImageChanger.user.js
```


## How to USE

>[!NOTE]
Make sure your script is enabled from the tamper monkey extension. Refresh the page to load the buttons.

![UI Description](https://github.com/deepratnaawale/Yodayo-Custom-Chat-Background-And-Image-TamperMonkey-Script/blob/main/UI.png)

From Left to Right: Remove Background (Default Bg), Change Background, Delete Character Image(Default, empty if none), Change/Add Character Image

![UI Expanded](https://github.com/deepratnaawale/Yodayo-Custom-Chat-Background-And-Image-TamperMonkey-Script/blob/main/UI-Expanded.png)

When Change Background / Change Character Image Button is pressed you will get two input boxes, one for uploading files and the other for urls.


## First Run
The script might ask you permission to execute **GM_xmlhttpRequests**, this is **required to load the images from urls** of any domain. If permission is not granted yodayo does not allow setting images outside its own domain, google storage api, reddit, and fb. So to mitigate this, I am using your browser to make requests to the links you are inputting. 

*No there is no security risk as long as you don't try to upload some shady picture from questionable sources.* 

**<u>CHOOSE ALLOW ALWAYS OPTION/ ALLOW ON DOMAIN OPTION.</u>**

# Release Notes: 

[Release Notes V1.4](RELEASE_NOTES.md)
