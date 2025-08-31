// Global variables
let bibleContent = null;
let currentBook = null;
let currentChapter = null;
let readingProgress = 0;
let sessionActive = false;
let progressTimer = null;
let hasValidToken = false;

// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Check for valid token on page load
function checkTokenAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenId = urlParams.get('tokenId');
    
    // Valid token for Bible access
    if (tokenId === 'missao-a4b8c7d6e5') {
        hasValidToken = true;
        return true;
    }
    
    hasValidToken = false;
    return false;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupSearchHandlers();
    setupEventListeners();
    
    // Check token access first
    checkTokenAccess();
    
    // Auto-authenticate on page load
    autoAuthenticate();
});

function setupSearchHandlers() {
    // Setup search functionality for the facade
    const searchInput = document.getElementById('searchInput');
    
    // Secret keyword detection
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

function setupEventListeners() {
    const closeQuranModal = document.getElementById('closeQuranModal');
    const closeBibleBtn = document.getElementById('closeBibleBtn');
    const panicBtn = document.getElementById('panicBtn');
    const bookSelect = document.getElementById('bookSelect');
    const chapterSelect = document.getElementById('chapterSelect');
    const modalContent = document.getElementById('modalContent');
    
    if (closeQuranModal) {
        closeQuranModal.addEventListener('click', hideQuranModal);
    }
    
    if (closeBibleBtn) {
        closeBibleBtn.addEventListener('click', hideBibleModal);
    }
    
    // Prevent modal from closing when clicking inside content
    if (modalContent) {
        modalContent.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    
    if (bookSelect) {
        bookSelect.addEventListener('change', handleBookChange);
    }
    
    if (chapterSelect) {
        chapterSelect.addEventListener('change', handleChapterChange);
    }
    
    // Auto-save progress every 30 seconds
    setInterval(saveProgress, 30000);
    
    // Save progress on page unload
    window.addEventListener('beforeunload', saveProgress);
}

function checkSession() {
    // Check if user has valid session cookie
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session='));
    
    if (sessionCookie) {
        sessionActive = true;
    } else {
        sessionActive = false;
    }
    return sessionActive;
}

function autoAuthenticate() {
    // Auto-authenticate user when they enter the site
    const sessionId = 'mock-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Set session cookie (remove secure flag for localhost)
    document.cookie = `session=${sessionId}; path=/; samesite=strict; max-age=7200`;
    
    sessionActive = true;
}

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    // Re-check session from cookies
    checkSession();
    
    // Check for secret keyword - requires valid token
    if (keyword === 'emanuel') {
        if (!hasValidToken) {
            // No valid token - fall back to Quran search
            simulateQuranSearch(keyword);
            return;
        }
        
        if (sessionActive) {
            // Secret keyword detected with valid session AND token
            try {
                const loaded = await loadBibleContent();
                if (loaded) {
                    showBibleModal();
                    searchInput.value = ''; // Clear the search
                } else {
                    // Fall back to Quran search to maintain facade
                    simulateQuranSearch(keyword);
                }
            } catch (error) {
                // Fall back to Quran search to maintain facade
                simulateQuranSearch(keyword);
            }
        } else {
            // Try to re-authenticate
            autoAuthenticate();
            
            if (sessionActive) {
                try {
                    const loaded = await loadBibleContent();
                    if (loaded) {
                        showBibleModal();
                        searchInput.value = '';
                    } else {
                        simulateQuranSearch(keyword);
                    }
                } catch (error) {
                    simulateQuranSearch(keyword);
                }
            } else {
                simulateQuranSearch(keyword);
            }
        }
    } else {
        // Normal Quran search facade
        simulateQuranSearch(keyword);
    }
}

function simulateQuranSearch(keyword) {
    const resultsSection = document.getElementById('searchResults');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Use the new search function from quranData
    const searchResults = quranData.search(keyword);
    
    if (searchResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على نتائج للبحث عن "${keyword}"</p>
            </div>
        `;
    } else {
        let resultsHTML = `<h3>نتائج البحث (${searchResults.length})</h3>`;
        
        searchResults.forEach(result => {
            resultsHTML += `
                <div class="result-item">
                    <div class="result-header">
                        <span class="surah-name">${result.suraName}</span>
                        <span class="ayah-number">آية ${result.ayahNumber}</span>
                        <span class="surah-translation">${result.suraNameTranslation}</span>
                    </div>
                    <div class="arabic-text">${result.arabic}</div>
                    <div class="translation">${result.translation}</div>
                    <div class="transliteration">${result.transliteration}</div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = resultsHTML;
    }
    
    resultsSection.classList.remove('hidden');
}

function showQuranResultsInline(keyword) {
    const searchResultsSection = document.getElementById('searchResults');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Search in mock Quran data
    const results = searchQuranData(keyword);
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h4>لا توجد نتائج</h4>
                <p>لم يتم العثور على نتائج للبحث عن "${keyword}"</p>
            </div>
        `;
    } else {
        let html = '';
        results.forEach(result => {
            const surahName = quranData.surahs.find(s => s.number === result.surah)?.name || 'سورة';
            html += `
                <div class="quran-result-item">
                    <div class="quran-verse-arabic">${result.text}</div>
                    <div class="quran-verse-translation">${result.translation}</div>
                    <div class="quran-verse-reference">${surahName} - آية ${result.verse}</div>
                </div>
            `;
        });
        resultsContainer.innerHTML = html;
    }
    
    // Show results section
    searchResultsSection.classList.remove('hidden');
}

function searchQuranData(keyword) {
    const results = [];
    
    // Search in predefined search terms
    if (quranData.searchTerms[keyword]) {
        results.push(...quranData.searchTerms[keyword]);
    }
    
    // Also search in Arabic and English text
    quranData.surahs.forEach(surah => {
        surah.content.forEach((verse, index) => {
            if (verse.toLowerCase().includes(keyword) || 
                (surah.translations && surah.translations[index] && 
                 surah.translations[index].toLowerCase().includes(keyword))) {
                results.push({
                    surah: surah.number,
                    verse: index + 1,
                    text: verse,
                    translation: surah.translations ? surah.translations[index] : ''
                });
            }
        });
    });
    
    return results.slice(0, 10); // Limit to 10 results
}

async function loadBibleContent() {
    // NEVER cache - always download fresh from S3 and delete after use
    try {
        // Download Bible content from S3 via our secure endpoint
        const response = await fetch('/api/s3-bible/emanuel-bible-access', {
            method: 'GET',
            cache: 'no-store', // Prevent browser caching
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load Bible content: ${response.status} ${response.statusText}`);
        }

        const markdownContent = await response.text();

        // Parse markdown content into structured data (in memory only - will be deleted on modal close)
        bibleContent = parseMarkdownBible(markdownContent);

        if (bibleContent && Object.keys(bibleContent).length > 0) {
            populateBookSelect();
            return true;
        } else {
            throw new Error('No content parsed from markdown');
        }
    } catch (error) {
        return false;
    }
}

function parseMarkdownBible(markdown) {
    const books = {};
    const lines = markdown.split('\n');
    let currentBook = null;
    let currentChapter = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Book headers (## BookName)
        if (line.startsWith('## ') && !line.includes('Capítulo')) {
            currentBook = line.substring(3).trim();
            books[currentBook] = {};
            currentChapter = null;
        }

        // Chapter headers (### Capítulo N)
        else if (line.startsWith('### Capítulo ')) {
            const chapterNum = line.substring(13).trim();
            currentChapter = chapterNum;
            if (currentBook) {
                books[currentBook][currentChapter] = [];
            }
        }

        // Verses (**N** text)
        else if (line.startsWith('**') && line.includes('**') && currentBook && currentChapter) {
            const verseMatch = line.match(/\*\*(\d+)\*\*\s*(.+)/);
            if (verseMatch) {
                const verseNum = parseInt(verseMatch[1]);
                const verseText = verseMatch[2].trim();

                books[currentBook][currentChapter].push({
                    verse: verseNum,
                    text: verseText
                });
            }
        }
    }

    return books;
}

function populateBookSelect() {
    const bookSelect = document.getElementById('bookSelect');

    if (!bibleContent || !bookSelect) return;

    // Clear existing options
    bookSelect.innerHTML = '<option value="">Selecione um livro...</option>';

    // Add books from parsed Bible content
    Object.keys(bibleContent).forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bookSelect.appendChild(option);
    });
}

function handleBookChange() {
    const bookSelect = document.getElementById('bookSelect');
    const chapterSelect = document.getElementById('chapterSelect');
    const selectedBook = bookSelect.value;

    if (!selectedBook) {
        chapterSelect.innerHTML = '<option value="">Capítulo...</option>';
        return;
    }

    const book = bibleContent[selectedBook];
    if (book) {
        currentBook = selectedBook; // Store book name, not object
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo...</option>';

        Object.keys(book).forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = `Capítulo ${chapter}`;
            chapterSelect.appendChild(option);
        });
    }
}

function handleChapterChange() {
    const chapterSelect = document.getElementById('chapterSelect');
    const selectedChapter = chapterSelect.value;

    if (!selectedChapter || !currentBook) {
        return;
    }

    const chapter = bibleContent[currentBook][selectedChapter];
    if (chapter) {
        currentChapter = selectedChapter; // Store chapter name, not object
        displayChapter(currentBook, selectedChapter);
        updateProgress();
    }
}

function displayChapter(book, chapter) {
    const content = document.getElementById('bibleContent');

    if (!bibleContent[book] || !bibleContent[book][chapter]) {
        content.innerHTML = '<div class="error">Capítulo não encontrado.</div>';
        return;
    }

    const verses = bibleContent[book][chapter];
    
    let html = `<h3>${book} - Capítulo ${chapter}</h3>`;

    verses.forEach(verse => {
        html += `
            <div class="bible-verse">
                <span class="verse-number">${verse.verse}</span>
                ${verse.text}
            </div>
        `;
    });

    content.innerHTML = html;

    // Progress tracking removed (no progress bar)

    // Clear any potential traces in DOM
    setTimeout(() => {
        // Remove any data attributes that might be added
        content.removeAttribute('data-book');
        content.removeAttribute('data-chapter');
    }, 100);
}

function startReadingTimer() {
    if (progressTimer) {
        clearInterval(progressTimer);
    }
    
    progressTimer = setInterval(() => {
        // Auto-save progress every minute while reading
        saveProgress();
    }, 60000);
}

function updateProgress() {
    // Calculate reading progress based on current position
    if (bibleContent && bibleContent.livros && currentBook && currentChapter) {
        const totalBooks = bibleContent.livros.length;
        const currentBookIndex = bibleContent.livros.findIndex(b => b.nome === currentBook.nome);
        const totalChapters = currentBook.capitulos.length;
        const currentChapterIndex = currentBook.capitulos.findIndex(c => c.numero === currentChapter.numero);
        
        // Simple progress calculation
        const bookProgress = (currentBookIndex / totalBooks) * 100;
        const chapterProgress = (currentChapterIndex / totalChapters) * (100 / totalBooks);
        readingProgress = Math.min(100, bookProgress + chapterProgress);
        
        // Progress bar removed - no UI update needed
    }
}

async function saveProgress() {
    if (!sessionActive || !currentBook || !currentChapter) {
        return;
    }
    
    const localLeitura = `${currentBook} ${currentChapter}:1`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                localLeitura: localLeitura,
                tempoLeitura: 60, // 1 minute increment
                percentualCompleto: readingProgress
            })
        });
        
    } catch (error) {
        // Silent fail
    }
}

function loadLastPosition(ultimoLocalLeitura) {
    // Parse last reading position and navigate to it
    const parts = ultimoLocalLeitura.split(' ');
    if (parts.length >= 2) {
        const bookName = parts[0];
        const chapterVerse = parts[1].split(':');
        const chapterNum = parseInt(chapterVerse[0]);
        
        // Set selectors
        const bookSelect = document.getElementById('bookSelect');
        const chapterSelect = document.getElementById('chapterSelect');
        
        bookSelect.value = bookName;
        handleBookChange();
        
        setTimeout(() => {
            chapterSelect.value = chapterNum;
            handleChapterChange();
        }, 100);
    }
}

async function handlePanic() {
    if (!confirm('Tem certeza que deseja ativar o botão de pânico? Esta ação irá comprometer permanentemente este artefato.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/panic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear all data and close modal
            bibleContent = null;
            sessionActive = false;
            
            // Clear cookies
            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Close modal and show alert
            hideBibleModal();
            
            // Redirect to a safe page after a delay
            setTimeout(() => {
                window.location.href = 'about:blank';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error activating panic button:', error);
        // Even if the request fails, clear local data for safety
        bibleContent = null;
        sessionActive = false;
        hideBibleModal();
    }
}

function showBibleModal() {
    const modal = document.getElementById('bibleModal');
    
    // Auto-load first book and chapter for default reading
    if (bibleContent) {
        const firstBook = Object.keys(bibleContent)[0];
        const firstChapter = Object.keys(bibleContent[firstBook])[0];
        
        currentBook = firstBook;
        currentChapter = firstChapter;
        
        // Populate selectors and set default values
        populateBookSelect();
        
        // Set default selections
        const bookSelect = document.getElementById('bookSelect');
        const chapterSelect = document.getElementById('chapterSelect');
        
        if (bookSelect) {
            bookSelect.value = firstBook;
            handleBookChange();
            
            setTimeout(() => {
                if (chapterSelect) {
                    chapterSelect.value = firstChapter;
                    handleChapterChange();
                }
            }, 100);
        }
    }
    
    if (!modal) {
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Prevent scrolling on background
    document.body.style.overflow = 'hidden';
}

function hideBibleModal() {
    const modal = document.getElementById('bibleModal');
    modal.classList.add('hidden');
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
    
    // Reset content area
    const content = document.getElementById('bibleContent');
    if (content) {
        content.innerHTML = '<div class="loading">Carregando conteúdo...</div>';
    }
    
    // Clear progress timer
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
    
    // CRITICAL: Immediately delete downloaded S3 content from memory
    bibleContent = null;
    
    // ALWAYS clear all data - no exceptions, no caching allowed
    clearNavigationBreadcrumbs();
    clearAllTrackingData();
    
    // Force session invalidation - CRITICAL FIX
    sessionActive = false;
    
    // Clear session cookie immediately
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = `session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
}

function hideQuranModal() {
    const modal = document.getElementById('quranModal');
    modal.classList.add('hidden');
    
    // Restore scrolling
    document.body.style.overflow = 'auto';
}

// Cache management
function clearCache() {
    bibleContent = null;
    localStorage.removeItem('bibleCache');
    sessionStorage.clear();
}

// Clear navigation breadcrumbs and reset UI
function clearNavigationBreadcrumbs() {
    // Reset book and chapter selects
    const bookSelect = document.getElementById('bookSelect');
    const chapterSelect = document.getElementById('chapterSelect');
    
    if (bookSelect) {
        bookSelect.selectedIndex = 0;
    }
    
    if (chapterSelect) {
        chapterSelect.innerHTML = '<option value="">Capítulo...</option>';
        chapterSelect.selectedIndex = 0;
    }
    
    // Clear bible content area
    const bibleContent = document.getElementById('bibleContent');
    if (bibleContent) {
        bibleContent.innerHTML = '<div class="loading">Carregando conteúdo...</div>';
    }
    
    // Progress bar removed - no reset needed
    
    // Reset global state variables
    currentBook = null;
    currentChapter = null;
    readingProgress = 0;
}

// Clear all tracking data for security - NO CACHING ALLOWED
function clearAllTrackingData() {
    // Clear ALL localStorage entries
    localStorage.clear();
    
    // Clear ALL sessionStorage entries
    sessionStorage.clear();
    
    // Clear cookies (session and any tracking cookies)
    const cookies = ['session', 'progress', 'lastRead', 'auth', 'bible-access'];
    cookies.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    // Clear global variables completely
    bibleContent = null;
    sessionActive = false;
    currentBook = null;
    currentChapter = null;
    readingProgress = 0;
    
    // Clear any cached API responses and service worker caches
    if (window.caches) {
        caches.keys().then(function(names) {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }
    
    // Clear IndexedDB completely
    if (window.indexedDB) {
        try {
            // Get all databases and delete them
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
            }).catch(() => {
                // Fallback for older browsers
                indexedDB.deleteDatabase('BibleDB');
                indexedDB.deleteDatabase('ContentCache');
            });
        } catch (e) {
            // Silent fail
        }
    }
    
    // Clear browser history entries
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clear DOM elements and attributes
    const bibleContentEl = document.getElementById('bibleContent');
    if (bibleContentEl) {
        bibleContentEl.innerHTML = '<div class="loading">Carregando conteúdo...</div>';
        // Remove any data attributes
        Array.from(bibleContentEl.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                bibleContentEl.removeAttribute(attr.name);
            }
        });
    }
    
    // Clear any memory references
    if (typeof window.performance !== 'undefined' && window.performance.clearResourceTimings) {
        window.performance.clearResourceTimings();
    }
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
}

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    if (sessionActive) {
        saveProgress();
    }
});

// Security: Clear data if page is hidden (tab switch, etc.)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && sessionActive) {
        saveProgress();
    }
});

// Simulate NFC authentication for testing
function simulateNFCAuth() {
    // Simulating NFC authentication silently
    
    // Simulate setting a session cookie
    document.cookie = 'session=mock-session-' + Date.now() + '; path=/; max-age=7200';
    
    // Update session status
    sessionActive = true;
    
    // Mock session created
    
    // Visual feedback
    const testBtn = document.getElementById('testAuthBtn');
    if (testBtn) {
        testBtn.textContent = '✅ Authenticated';
        testBtn.style.background = '#27ae60';
        
        setTimeout(() => {
            testBtn.textContent = '🔧 Test NFC Auth';
            testBtn.style.background = '#95a5a6';
        }, 2000);
    }
}

// Dark Mode Toggle Function
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (newTheme === 'dark') {
        toggleIcon.textContent = '☀️';
    } 
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        const toggleIcon = document.querySelector('.toggle-icon');
        if (toggleIcon) toggleIcon.textContent = '☀️';
    }
}

// Keyboard shortcuts for quick actions
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+P for panic (hidden shortcut)
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        if (sessionActive && !document.getElementById('bibleModal').classList.contains('hidden')) {
            handlePanic();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        if (!document.getElementById('bibleModal').classList.contains('hidden')) {
            hideBibleModal();
        } else if (!document.getElementById('quranModal').classList.contains('hidden')) {
            hideQuranModal();
        }
    }
});
