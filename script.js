async function checkBalance() {
    const playerName = document.getElementById('playerName').value.trim();
    const resultDiv = document.getElementById('result');
    
    if (!playerName) {
        showError('Bitte geben Sie einen Spielernamen ein.');
        return;
    }

    try {
        const response = await fetch(`http://45.81.232.226:4567/api/player-balance?player=${encodeURIComponent(playerName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const statsHtml = `
            <div class="player-skin">
                <img src="https://crafatar.com/renders/body/${data.uuid}?overlay=true" alt="${data.playerName}'s skin">
            </div>
            <div class="player-info">
                <div class="stat-card">
                    <div class="stat-label">Spielername</div>
                    <div class="stat-value">${data.playerName}</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Klasse</div>
                    <div class="stat-value">${data.class.name} (Level ${data.class.level})</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Spieler Balance</div>
                    <div class="stat-value">${formatNumber(data.playerBalance)} Coins</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Bank Balance</div>
                    <div class="stat-value">${formatNumber(data.bankBalance)} Coins</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-label">Gesamt Balance</div>
                    <div class="stat-value">${formatNumber(data.totalBalance)} Coins</div>
                </div>
                
                ${data.guild ? `
                <div class="stat-card guild-card" onclick="showGuildInfo('${data.guild.name}')">
                    <div class="stat-label">Gilde</div>
                    <div class="stat-value">${data.guild.name} (${data.guild.rank})</div>
                    <div class="click-info"><i class="fas fa-info-circle"></i> Klicken für Details</div>
                </div>` : ''}
            </div>
        `;
        showSuccess(statsHtml);
    } catch (error) {
        showError('Es gab einen Fehler bei der Abfrage. Bitte versuchen Sie es später erneut.');
        console.error('Error:', error);
    }
}

function formatNumber(number) {
    return new Intl.NumberFormat('de-DE').format(number);
}

function showSuccess(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = message;
    resultDiv.className = 'result-container success';
    resultDiv.style.opacity = '0';
    setTimeout(() => {
        resultDiv.style.opacity = '1';
    }, 50);
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="stat-card">${message}</div>`;
    resultDiv.className = 'result-container error';
    resultDiv.style.opacity = '0';
    setTimeout(() => {
        resultDiv.style.opacity = '1';
    }, 50);
}

async function showGuildInfo(guildName) {
    const mainView = document.getElementById('main-view');
    const guildsView = document.getElementById('guilds-view');
    const guildDetailsView = document.getElementById('guild-details-view');
    
    try {
        const response = await fetch(`http://45.81.232.226:4567/api/guild-info?guild=${encodeURIComponent(guildName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const membersHtml = data.members.map(member => `
            <div class="member-card" onclick="checkBalance('${member.name}')">
                <img src="https://crafatar.com/avatars/${member.uuid}?size=32&overlay=true" alt="${member.name}">
                <div class="member-info">
                    <span class="member-name">${member.name}</span>
                    <span class="member-rank">${member.rank}</span>
                </div>
            </div>
        `).join('');

        const guildHtml = `
            <div class="guild-details">
                <h2><i class="fas fa-users"></i> ${data.name}</h2>
                <div class="guild-stats">
                    <div class="stat-card">
                        <div class="stat-label">Mitglieder</div>
                        <div class="stat-value">${data.members.length}</div>
                    </div>
                </div>
                <div class="members-list">
                    <h3>Mitglieder</h3>
                    <div class="members-grid">
                        ${membersHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Show guild details and hide other views
        mainView.style.display = 'none';
        guildsView.style.display = 'none';
        guildDetailsView.style.display = 'block';
        guildDetailsView.innerHTML = guildHtml;
        
        // Update URL and browser history
        history.pushState({ view: 'guild', name: guildName }, '', `#guild/${guildName}`);
        
    } catch (error) {
        guildDetailsView.innerHTML = '<div class="error">Es gab einen Fehler beim Laden der Gildeninformationen. Bitte versuchen Sie es später erneut.</div>';
        console.error('Error:', error);
    }
}

async function showGuildsList() {
    const mainView = document.getElementById('main-view');
    const guildsView = document.getElementById('guilds-view');
    const guildDetailsView = document.getElementById('guild-details-view');
    const guildsGrid = document.querySelector('.guilds-grid');

    // Show loading state
    guildsGrid.innerHTML = '<div class="loading">Lade Gilden...</div>';
    mainView.style.display = 'none';
    guildsView.style.display = 'block';
    guildDetailsView.style.display = 'none';

    try {
        const response = await fetch('http://45.81.232.226:4567/api/guilds');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const guilds = data.guilds; // Die Gilden sind in einem "guilds" Array
        
        // Format and display guilds
        const guildsHtml = guilds.map(guild => `
            <div class="guild-card">
                <h2 class="guild-name">${guild.name}</h2>
                <div class="guild-info">
                    <p><i class="fas fa-user"></i> Besitzer: ${guild.ownerName}</p>
                    <p><i class="fas fa-calendar"></i> Erstellt am: ${new Date(guild.createdAt).toLocaleDateString('de-DE')}</p>
                </div>
                <button class="view-guild-btn" onclick="showGuildInfo('${guild.name}')">
                    <i class="fas fa-info-circle"></i> Details anzeigen
                </button>
            </div>
        `).join('');

        guildsGrid.innerHTML = guildsHtml;

        // Update browser history
        history.pushState({ view: 'guilds' }, '', '#guilds');
    } catch (error) {
        guildsGrid.innerHTML = '<div class="error">Fehler beim Laden der Gilden. Bitte versuchen Sie es später erneut.</div>';
        console.error('Error:', error);
    }
}

function showStatsChecker() {
    const mainView = document.getElementById('main-view');
    const guildsView = document.getElementById('guilds-view');
    const guildDetailsView = document.getElementById('guild-details-view');
    
    mainView.style.display = 'block';
    guildsView.style.display = 'none';
    guildDetailsView.style.display = 'none';
    
    // Clear any previous results
    document.getElementById('result').innerHTML = '';
    document.getElementById('playerName').value = '';
    
    // Update browser history
    history.pushState({ view: 'stats' }, '', '#stats');
}

// Enter-Taste Unterstützung
document.getElementById('playerName').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkBalance();
    }
});

// Browser Zurück-Button Handler
window.addEventListener('popstate', function(event) {
    if (!event.state) {
        showStatsChecker();
    } else if (event.state.view === 'stats') {
        showStatsChecker();
    } else if (event.state.view === 'guilds') {
        showGuildsList();
    } else if (event.state.view === 'guild') {
        showGuildInfo(event.state.name);
    }
});

// Initial state
if (window.location.hash === '#guilds') {
    showGuildsList();
} else if (window.location.hash.startsWith('#guild/')) {
    const guildName = window.location.hash.substring(7);
    showGuildInfo(guildName);
} else {
    showStatsChecker();
}
