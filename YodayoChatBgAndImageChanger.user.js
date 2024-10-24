// ==UserScript==
// @name         Yodayo Custom Chat Background
// @namespace    Pervertir
// @version      1.7
// @description  Change the background images of ANY Yodayo Chat and Character to any image and remember the setting for each chat. The memory is not shared for a character but different for each chat.

// @author       pervertir

// @homepageURL  https://github.com/pervertir/Yodayo-Custom-Bg-Char-Image
// @supportURL   https://github.com/pervertir/Yodayo-Custom-Bg-Char-Image/issues
// @downloadURL   https://github.com/pervertir/Yodayo-Custom-Bg-Char-Image/raw/main/YodayoChatBgAndImageChanger.user.js
// @updateURL    https://github.com/pervertir/Yodayo-Custom-Bg-Char-Image/raw/main/YodayoChatBgAndImageChanger.user.js

// @match        https://moescape.ai/tavern/chat/*
// @grant        GM_xmlhttpRequest
// @connect      *

// @icon         https://moescape.ai/assets/images/logo.svg
// ==/UserScript==

(function () {
    'use strict';

    const DB_NAME = 'YodayoChatBgandCharDB';
    const DB_VERSION = 1;
    const BACKGROUND_OBJECT_STORE_NAME = 'Backgrounds';
    const CHARACTER_OBJECT_STORE_NAME = 'Characters';
    const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();
    const CHAR_ID = 'char_' + CHAT_ID;
    console.log(`Chat ID: ${CHAT_ID}`);


    let db;

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Failed to open database:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                db.createObjectStore(BACKGROUND_OBJECT_STORE_NAME, { keyPath: 'CHAT_ID' });
                console.log('Created Object Store', 'backgrounds');
                db.createObjectStore(CHARACTER_OBJECT_STORE_NAME, { keyPath: 'CHAR_ID' });
                console.log('Created Object Store', 'characters');
            };
        });
    }

    async function saveBackgroundImage(CHAT_ID, imageBase64) {
        if (!db) {
            await openDatabase();
        }

        const transaction = db.transaction(BACKGROUND_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(BACKGROUND_OBJECT_STORE_NAME);
        objectStore.put({ CHAT_ID, imageBase64 });
    }

    async function saveCharacterImage(CHAR_ID, imageBase64) {
        if (!db) {
            await openDatabase();
        }

        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        objectStore.put({ CHAR_ID, imageBase64 });
    }

    async function getBackgroundImage(CHAT_ID) {
        if (!db) {
            await openDatabase();
        }

        const transaction = db.transaction(BACKGROUND_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(BACKGROUND_OBJECT_STORE_NAME);
        const request = objectStore.get(CHAT_ID);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve(result.imageBase64);
                } else {
                    resolve(null);
                }
            };

            request.onerror = (event) => {
                console.error('Failed to get image:', event.target.error);
                reject(event.target.error);
            };
        });
    }


    async function getCharacterImage(CHAR_ID) {
        if (!db) {
            await openDatabase();
        }

        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const request = objectStore.get(CHAR_ID);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve(result.imageBase64);
                } else {
                    resolve(null);
                }
            };

            request.onerror = (event) => {
                console.error('Failed to get image:', event.target.error);
                reject(event.target.error);
            };
        });
    }


    // Function to convert URL to Base64
    async function urlToBase64(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function (response) {
                    if (response.status === 200) {
                        const blob = response.response;
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.readAsDataURL(blob);
                    } else {
                        reject(new Error(`HTTP error! Status: ${response.status}`));
                    }
                },
                onerror: function (error) {
                    console.error('Error fetching image:', error);
                    reject(error);
                }
            });
        });
    }

    async function setBackgroundImage(imageBase64) {
        setTimeout(async function () {
            const targetDivs = document.querySelectorAll('.bg-cover, .bg-primaryBg');
            if (!targetDivs.length) {
                console.error('Background divs not found.');
                return;
            }
            const divElements = Array.from(targetDivs).filter((element) => element.tagName === 'DIV');

            console.log('Setting new background image');
            divElements.forEach((targetDiv) => {
                targetDiv.style.backgroundImage = `url('data:image;base64,${imageBase64}')`;
                targetDiv.style.backgroundSize = 'cover';
                targetDiv.classList.remove('container');
            });

            // Save to local db if image is different
            let savedImageBase64 = await getBackgroundImage(CHAT_ID);
            if (savedImageBase64 !== imageBase64) {
                await saveBackgroundImage(CHAT_ID, imageBase64);
                console.log('Saved background for Chat Id:', CHAT_ID, ' : ', imageBase64.substring(0, 100));
            } else {
                console.log('Background image already exists in DB.');
            }
        }, 1000)
    }

    async function setCharacterImage(imageBase64) {
        setTimeout(async function () { // Ensuring the timeout waits for 2 seconds before executing the code within
            console.log('Wait for 2 seconds for page to load.');

            const characterContainer = document.querySelector('.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2');

            if (characterContainer) {
                // Check if character image already exists
                const existingImage = characterContainer.querySelector('div > div > img');

                if (existingImage) {
                    // Change the existing character image if different
                    let savedImageBase64 = await getCharacterImage(CHAR_ID);
                    existingImage.src = `data:image;base64,${imageBase64}`;
                    existingImage.style.height = "90vh";
                    console.log('Changed Character Image.');
                    if (savedImageBase64 !== imageBase64) {
                        console.log('Added to DB', CHAR_ID, ' : ', imageBase64.substring(0, 100));
                        await saveCharacterImage(CHAR_ID, imageBase64);
                    } else {
                        console.log('Character image already exists in DB.');
                        console.log(CHAR_ID, ' : ', imageBase64.substring(0, 100));
                    }
                } else {
                    // Ensure that the nested divs exist
                    let innerDiv = characterContainer.querySelector('div > div');
                    if (!innerDiv) {
                        // Create missing nested divs
                        innerDiv = document.createElement('div');
                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.appendChild(innerDiv);
                        characterContainer.innerHTML = ''; // Clear any existing content
                        characterContainer.appendChild(wrapperDiv);
                    }

                    // Create a new character image
                    const newImage = document.createElement('img');
                    newImage.src = `data:image;base64,${imageBase64}`;
                    newImage.classList.add('mx-auto', 'h-full', 'w-auto', 'object-contain', 'object-bottom');
                    innerDiv.innerHTML = ''; // Clear any existing content within the inner div
                    innerDiv.appendChild(newImage);
                    innerDiv.style.height = "90vh";
                    console.log('New Character image set.');
                    await saveCharacterImage(CHAR_ID, imageBase64);
                }
            } else {
                console.error('Character container not found');
            }
        }, 1000); // Delay of 2 seconds
    }


    async function setupInputs() {
        console.log('Setting up inputs...');

        // Function to convert file to Base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }

        // Function to handle file input change
        async function handleFileInputChange(event) {
            const file = event.target.files[0];
            const imageBase64 = await fileToBase64(file);
            const action = document.querySelector('.input-container').dataset.action;
            if (action === 'setBackgroundImage' && imageBase64) {
                setBackgroundImage(imageBase64);
            } else if (action === 'setCharacterImage' && imageBase64) {
                setCharacterImage(imageBase64);
            }
        }

        // Function to handle URL input change
        async function handleUrlInputChange(event) {
            const url = event.target.value;
            const imageBase64 = await urlToBase64(url);
            const action = document.querySelector('.input-container').dataset.action;
            if (action === 'setBackgroundImage' && imageBase64) {
                setBackgroundImage(imageBase64);
            } else if (action === 'setCharacterImage' && imageBase64) {
                setCharacterImage(imageBase64);
            }
        }

        // Add button element
        const changeBackgroundButton = document.createElement('button');
        changeBackgroundButton.title = 'Change Background';
        changeBackgroundButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M200-120q-33 0-56.5-23.5T120-200v-240h80v240h240v80H200Zm320 0v-80h240v-240h80v240q0 33-23.5 56.5T760-120H520ZM240-280l120-160 90 120 120-160 150 200H240ZM120-520v-240q0-33 23.5-56.5T200-840h240v80H200v240h-80Zm640 0v-240H520v-80h240q33 0 56.5 23.5T840-760v240h-80Zm-140-40q-26 0-43-17t-17-43q0-26 17-43t43-17q26 0 43 17t17 43q0 26-17 43t-43 17Z"/></svg>';
        changeBackgroundButton.classList.add('order-4', 'change-background', 'relative', 'flex', 'h-9', 'w-9', 'items-center', 'justify-center', 'lg:h-11', 'lg:w-11', 'cursor-pointer', 'items-center', 'justify-center', 'leading-tight', 'rounded-full', 'bg-black/60', 'backdrop-blur-sm');
        changeBackgroundButton.addEventListener('click', () => {
            const inputContainer = document.querySelector('.input-container');
            if (inputContainer.style.display === 'none' || !inputContainer.style.display) {
                inputContainer.style.display = 'block';
                // Set the action to run setBackgroundImage
                inputContainer.dataset.action = 'setBackgroundImage';
            } else {
                inputContainer.style.display = 'none';
            }
        });

        const changeCharacterButton = document.createElement('button');
        changeCharacterButton.title = 'Change Character';
        changeCharacterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>';
        changeCharacterButton.classList.add('order-4', 'change-background', 'relative', 'flex', 'h-9', 'w-9', 'items-center', 'justify-center', 'lg:h-11', 'lg:w-11', 'cursor-pointer', 'items-center', 'justify-center', 'leading-tight', 'rounded-full', 'bg-black/60', 'backdrop-blur-sm');
        changeCharacterButton.addEventListener('click', () => {
            const inputContainer = document.querySelector('.input-container');
            if (inputContainer.style.display === 'none' || !inputContainer.style.display) {
                inputContainer.style.display = 'block';
                // Set the action to run setCharacterImage
                inputContainer.dataset.action = 'setCharacterImage';
            } else {
                inputContainer.style.display = 'none';
            }
        });

        // Add Remove Background button
        const removeBgButton = document.createElement('button');
        removeBgButton.title = 'Remove Background';
        removeBgButton.style.backgroundColor = "rgba(130, 0, 0, 0.6)";
        removeBgButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M120-574v-85l181-181h85L120-574Zm0-196v-70h70l-70 70Zm527 67q-10-11-21.5-21.5T602-743l97-97h85L647-703ZM220-361l77-77q7 11 14.5 20t16.5 17q-28 7-56.5 17.5T220-361Zm480-197v-2q0-19-3-37t-9-35l152-152v86L700-558ZM436-776l65-64h85l-64 64q-11-2-21-3t-21-1q-11 0-22 1t-22 3ZM120-375v-85l144-144q-2 11-3 22t-1 22q0 11 1 21t3 20L120-375Zm709 83q-8-12-18.5-23T788-335l52-52v85l-11 10Zm-116-82q-7-3-14-5.5t-14-4.5q-9-3-17.5-6t-17.5-5l190-191v86L713-374Zm-233-26q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480ZM160-120v-71q0-34 17-63t47-44q51-26 115.5-44T480-360q76 0 140.5 18T736-298q30 15 47 44t17 63v71H160Zm81-80h478q-2-9-7-15.5T699-226q-36-18-91.5-36T480-280q-72 0-127.5 18T261-226q-8 4-13 11t-7 15Zm239 0Zm0-360Z"/></svg>';
        removeBgButton.classList.add('order-4', 'remove-background', 'relative', 'flex', 'h-9', 'w-9', 'items-center', 'justify-center', 'lg:h-11', 'lg:w-11', 'cursor-pointer', 'items-center', 'justify-center', 'leading-tight', 'rounded-full', 'bg-red/60', 'backdrop-blur-sm');
        removeBgButton.addEventListener('click', async () => {
            setBackgroundImage(null);
            // Remove from local db
            await saveBackgroundImage(CHAT_ID, null);
            window.location.reload();
        });

        const removeCharacterButton = document.createElement('button');
        removeCharacterButton.title = 'Remove Character';
        removeCharacterButton.style.backgroundColor = "rgba(130,0,0,0.6)";
        removeCharacterButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M791-55 686-160H160v-112q0-34 17.5-62.5T224-378q45-23 91.5-37t94.5-21L55-791l57-57 736 736-57 57ZM240-240h366L486-360h-6q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm496-138q29 14 46 42.5t18 61.5L666-408q18 7 35.5 14t34.5 16ZM568-506l-59-59q23-9 37-29.5t14-45.5q0-33-23.5-56.5T480-720q-25 0-45.5 14T405-669l-59-59q23-34 58-53t76-19q66 0 113 47t47 113q0 41-19 76t-53 58Zm38 266H240h366ZM457-617Z"/></svg>';
        removeCharacterButton.classList.add('order-4', 'remove-character', 'relative', 'flex', 'h-9', 'w-9', 'items-center', 'justify-center', 'lg:h-11', 'lg:w-11', 'cursor-pointer', 'items-center', 'justify-center', 'leading-tight', 'rounded-full', 'bg-red/60', 'backdrop-blur-sm');
        removeCharacterButton.addEventListener('click', async () => {
            setCharacterImage(null);
            // Remove from local db
            await saveCharacterImage(CHAR_ID, null);
            window.location.reload();
        });

        // Add file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.classList.add('my-1', 'no-scrollbar', 'max-h-[129px]', 'border', 'w-full', 'resize-none', 'rounded-[22.5px]', 'border-separator/50', 'bg-transparent', 'py-3', 'pl-4', 'pr-12', 'text-sm', 'font-medium', 'text-primaryText', 'outline-none', 'backdrop-blur-sm', 'transition-all', 'placeholder:text-secondaryText/70');
        fileInput.addEventListener('change', handleFileInputChange);

        // Add URL input element
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'Enter image URL';
        urlInput.classList.add('my-1', 'no-scrollbar', 'max-h-[129px]', 'border', 'w-full', 'resize-none', 'rounded-[22.5px]', 'border-separator/50', 'bg-transparent', 'py-3', 'pl-4', 'pr-12', 'text-sm', 'font-medium', 'text-primaryText', 'outline-none', 'backdrop-blur-sm', 'transition-all', 'placeholder:text-secondaryText/70');
        urlInput.addEventListener('input', handleUrlInputChange);

        // const targetElement = document.querySelector('#selected-model-container');
        let targetElement = document.querySelector('div.sticky.left-1\\/2.ml-4.flex.max-w-full.flex-1.-translate-x-1\\/2.cursor-pointer.justify-center.gap-4.text-primaryText');
        if (targetElement) {
            console.log('Char name targetfound.')
            // Create container for inputs
            const inputContainer = document.createElement('div');
            inputContainer.classList.add('input-container', 'hidden', 'flex', 'items-center', 'flex-col','p-2', 'order-3');
            inputContainer.style.maxWidth = '50%';
            
            // Append inputs to container
            inputContainer.appendChild(fileInput);
            inputContainer.appendChild(urlInput);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('flex', 'justify-end', 'ml-2', 'gap-4');
            
            buttonContainer.appendChild(inputContainer);
            buttonContainer.appendChild(changeBackgroundButton);
            buttonContainer.appendChild(changeCharacterButton);
            buttonContainer.appendChild(removeBgButton);
            buttonContainer.appendChild(removeCharacterButton);
            
            targetElement.classList.remove('left-1/2','-translate-x-1/2'); // model selector div
            targetElement.nextSibling.classList.remove('flex-1');
            targetElement.parentNode.insertBefore(buttonContainer, targetElement.nextSibling);

            const yodayo_logo = '.flex.flex-1.items-center.justify-start';
            // Call the waitForElement function with the desired selector and callback
            waitForElement(yodayo_logo, () => {
                document.querySelector(yodayo_logo)
                    .classList.replace('flex-1', 'flex-none');
            });


            // Hide input boxes when clicking outside
            document.addEventListener('click', (event) => {
                if (!inputContainer.contains(event.target) && (!changeBackgroundButton.contains(event.target) && !changeCharacterButton.contains(event.target))) {
                    inputContainer.style.display = 'none';
                }
            });
        } else {
            console.error('Target element not found');
        }
    }


    // Function to observe DOM for the target element
    function waitForElement(selector, callback) {
        const observer = new MutationObserver((mutations, observer) => {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Check local storage for previously set background image
    async function applySavedBackground() {
        setTimeout(async () => {
            let savedImageBase64 = await getBackgroundImage(CHAT_ID);
            console.log(`Applying Background from DB: ${savedImageBase64 ? savedImageBase64.substring(0, 100) : 'null'}`);

            if (savedImageBase64) {
                setBackgroundImage(savedImageBase64);
            }
        }, 250);
    }

    async function applySavedCharacter() {
        setTimeout(async () => {
            let savedCharacterImageBase64 = await getCharacterImage(CHAR_ID);
            console.log(`Applying Saved Character from DB: ${savedCharacterImageBase64 ? savedCharacterImageBase64.substring(0, 100) : 'null'}`);

            if (savedCharacterImageBase64) {
                setCharacterImage(savedCharacterImageBase64);
            }
        }, 200);
    }


    // Call the waitForElement function with the desired selector and callback
    waitForElement('div.sticky.left-1\\/2.ml-4.flex.max-w-full.flex-1.-translate-x-1\\/2.cursor-pointer.justify-center.gap-4.text-primaryText', () => { // Model Loader has loaded, proceed with adding the menu
        // Initialize DB
        openDatabase();

        // Add Change Bg, Remove Bg, Change Char, Remove Char, file input, url input boxes
        setupInputs();

        // Wait for element holding character image to load and then change it
        waitForElement('body > main > section > div > div.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2', applySavedCharacter);

        // Wait for background to load and then change it
        waitForElement('.bg-cover', applySavedBackground);

        // Find and modify the specific div
    });
})();
