const emojisMap = new Map();

export function handleEmojiClick(e) {
    const emojiDrawerButton = e.target.closest('[data-btn="emojis"]');
    if (emojiDrawerButton) {
        const dropdown = emojiDrawerButton.closest('.dropdown');
        const iconDropdownMenu = dropdown.querySelector('.icon_dropdown_menu');
        const emojisContainer = dropdown.querySelector('.emojis_container');
        if (!emojisContainer) {
            renderEmojis(emojisMap, iconDropdownMenu);
        }
    }

    const emojiButton = e.target.closest('.emoji_button');
    if (emojiButton) {
        const chatContainer = document.querySelector('.chat_container_item.active');
        const inputField = chatContainer.querySelector('[name="send_message"]');

        const emojisDrawer = emojiButton.closest('.emojis_container');
        const selectedEmoji = emojiButton.innerText;
        const emojiTitle = emojiButton.getAttribute("title");

        updateRecentEmojis(selectedEmoji, emojiTitle, emojisDrawer);

        // Append the emoji to the existing input value
        inputField.value += emojiButton.innerText;
    }
}

async function initEmojis() {
    const response = await fetch('./assets/emojis/emojis_v2.json');
    const emojisData = await response.json();

    for (const category of emojisData) {
        emojisMap.set(category.category, category.emojis);
    }
}

function getRecentEmojis() {
    return JSON.parse(localStorage.getItem('recentEmojis')) || [];
}

function saveRecentEmoji(emoji, title) {
    let recentEmojis = getRecentEmojis();

    // Remove duplicate emoji if it already exists
    recentEmojis = recentEmojis.filter(e => e.emoji !== emoji);

    // Add new emoji to the front
    recentEmojis.unshift({ emoji, title });

    if (recentEmojis.length > 14) {
        recentEmojis.pop();
    }

    // Save back to localStorage
    localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis));
}

function renderEmojis(emojisMap, emojisDrawer) {
    // Create the main container
    const container = document.createElement('div');
    container.classList.add('emojis_container');

    // Add search bar once
    container.innerHTML = `
        <div class="search_wrapper">
            <input type="text" placeholder="Search emojis..." name="emojis">
        </div>
    `;

    // Add "Recently Used" section if there are recent emojis
    const recentEmojis = getRecentEmojis();
    if (recentEmojis.length > 0) {
        container.innerHTML += `
            <div class="emojis_wrapper">
                <h4>Recently Used</h4>
                <ul class="emojis_list recent_emojis">
                    ${recentEmojis.map(e => `
                        <li class="emoji_item">
                            <button type="button" class="emoji_button" title="${e.title}" aria-label="${e.title}">
                                ${e.emoji}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Loop through Map and append only the emoji categories
    for (const [category, emojis] of emojisMap) {
        container.innerHTML += `
            <div class="emojis_wrapper">
                <h4>${category}</h4>
                <ul class="emojis_list">
                    ${emojis.map(e => `
                        <li class="emoji_item">
                            <button type="button" class="emoji_button" title="${e.title}" aria-label="${e.title}" data-emoji="${e.emoji}" data-title="${e.title}">
                                ${e.emoji}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Append everything to the #emojis drawer
    emojisDrawer.appendChild(container);

    // Add event listeners to all emoji buttons
    const emojiButtons = container.querySelectorAll('.emoji_button');
    emojiButtons.forEach(button => {
        button.addEventListener('click', () => {
            const emoji = button.getAttribute('data-emoji');
            const title = button.getAttribute('data-title');
            updateRecentEmojis(emoji, title, emojisDrawer);
        });
    });
}

function updateRecentEmojis(emoji, title, emojisDrawer) {
    // Save the new emoji to the recent emojis list
    saveRecentEmoji(emoji, title);

    // Re-render the "Recently Used" section
    const recentEmojisContainer = emojisDrawer.querySelector('.recent_emojis');
    if (recentEmojisContainer) {
        const recentEmojis = getRecentEmojis();
        recentEmojisContainer.innerHTML = recentEmojis.map(e => `
            <li class="emoji_item">
                <button type="button" class="emoji_button" title="${e.title}" aria-label="${e.title}">
                    ${e.emoji}
                </button>
            </li>
        `).join('');
    }
}

// Call function to fetch and initialize emojis
initEmojis();