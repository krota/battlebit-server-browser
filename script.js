window.addEventListener("load", () => {
    document.getElementById('refresh').addEventListener('click',getServers);
    document.getElementById('toggle-empty').addEventListener('click', () => {
        showEmptyServers = !showEmptyServers;
        document.getElementById('toggle-empty').textContent = showEmptyServers
          ? 'Hide Empty Servers'
          : 'Show Empty Servers';
    getServers();
  });
  getServers();
});

let showEmptyServers = false;

async function getServers() {
    const endpoint = "https://publicapi.battlebit.cloud/Servers/GetServerList";
    const serverListDiv = document.getElementById('servers');
    const statusDiv = document.getElementById('status');

    const gameModeNames = {
        CONQ: "Conquest",
        INFCONQ: "Infantry Conquest",
        RUSH: "Rush",
        DOMI: "Domination",
        FRONTLINE: "Frontline",
        VoxelFortify: "Voxel Fortify", // random community server mode
      };

    try {
        serverListDiv.innerHTML = '';
        statusDiv.textContent = 'Loading...'
        document.getElementById('loading-overlay').classList.add('visible');

        const res = await fetch(endpoint);
        if(!res.ok) {
            throw new Error(`Response status: ${res.status}`);
        }

        const servers = await res.json();
        console.log(servers);

        const filtered = showEmptyServers ? servers : servers.filter(s => s.Players > 0);
        const sorted = filtered.sort((a,b) => b.Players - a.Players);
        const grouped = new Map();

        sorted.forEach(server => {
            const region = server.Region;

            if(!grouped.has(region)) {
                grouped.set(region, []);
            }

            grouped.get(region).push(server);
        });

        grouped.forEach((servers, region) => {
            if (servers.length === 0) return;
            const regionDiv = document.createElement('div');
            const regionName = region.replace(/_/g, ' ');
            regionDiv.className = 'region-group';
            regionDiv.innerHTML = `
                <h2 class="region-header">
                    <span class="toggle-icon">▼</span> ${regionName}
                </h2>
                <div class="region-servers"></div>
                `;

            const header = regionDiv.querySelector('.region-header');
            const serversContainer = regionDiv.querySelector('.region-servers');
            const toggleIcon = regionDiv.querySelector('.toggle-icon');
            
            header.addEventListener('click', () => {
                serversContainer.classList.toggle('hidden');
                toggleIcon.classList.toggle('collapsed');
            });

            servers.forEach(server => {
                const readableGameMode = gameModeNames[server.Gamemode] || server.Gamemode;
                const lockIcon = server.HasPassword ? '🔒 ' : '';
                const serverName = `${lockIcon}${server.Name}`;
                const isFull = (server.Players + server.QueuePlayers) >= server.MaxPlayers;
                let statusBadge = '';
                if (isFull) {
                    statusBadge = `<span class="badge full">Full</span>`;
                } else if (!server.HasPassword) {
                    statusBadge = `<span class="badge joinable">Joinable</span>`;
                }
                const serverDiv = document.createElement('div');
                serverDiv.className = 'server';
                serverDiv.innerHTML = `
                    <div class="server-header">
                        <strong>${serverName}</strong>
                        ${statusBadge}
                    </div>
                    <div class="server-meta">
                        <div>Players: ${server.Players}/${server.MaxPlayers} (${server.QueuePlayers} in queue)</div>
                        <div>Game Mode: ${readableGameMode}</div>
                        <div>Map: ${server.Map}</div>
                        <div>Map Size: ${server.MapSize}</div>
                        <div>Password Protected: ${server.HasPassword ? 'Yes' : 'No'}</div>
                        <div>Official: ${server.IsOfficial ? 'Yes' : 'No'}</div>
                        <div>Tickrate: ${server.Hz}Hz</div>
                    </div>
                    `;
                serversContainer.appendChild(serverDiv);
            });

            serverListDiv.appendChild(regionDiv);
        });

        const now = new Date().toLocaleTimeString();
        statusDiv.textContent = `Last updated at ${now}`;
        document.getElementById('loading-overlay').classList.remove('visible');

    } catch (error) {
        console.error(error.message);
        statusDiv.textContent = "Error loading servers. Try again later.";
        statusDiv.style.color = "red";
    }
}