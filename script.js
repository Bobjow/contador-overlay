document.addEventListener('DOMContentLoaded', () => {
    // 🔄 Chaves mantidas na mesma estrutura
    const apiKeys = [
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ",
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4"
    ];
    
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    
    // 🔄 Variáveis originais mantidas
    let keyIndex = 0;
    let isLiveActive = false;
    let errorCount = { 403: 0, other: 0 };

    // ✅ Variáveis novas para otimização
    let cachedVideoId = null;
    let lastLikeCount = 0;
    let quotaCounter = { search: 0, video: 0 };

    // 📝 Novo sistema de logs (mantido)
    const log = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type}] ${message} (Chave: ${keyIndex + 1})`);
    };

    // 🔄 Funções originais mantidas
    const rotateMessages = () => { /* ... mantido igual ... */ };

    const rotateKey = () => { /* ... mantido igual ... */ };

    // 🆕 Verificação de live otimizada
    const checkExistingLive = async () => {
        try {
            if(!cachedVideoId) return null;
            
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${cachedVideoId}&key=${apiKeys[keyIndex]}`);
            if(response.ok) {
                quotaCounter.video++;
                const data = await response.json();
                return data.items?.[0]?.liveStreamingDetails?.isLiveNow ? cachedVideoId : null;
            }
            return null;
        } catch {
            return null;
        }
    };

    // ✨ getLiveVideoId modificado
    const getLiveVideoId = async () => {
        try {
            // Primeiro verifica a live existente (custo baixo)
            const existingLive = await checkExistingLive();
            if(existingLive) return existingLive;

            log('REQUEST', `Buscando live... [${CHANNEL_ID}]`);
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            quotaCounter.search += 100; // Cada search custa 100 quotas
            
            if(response.status === 403 || response.status === 400) {
                // ... mantido igual ...
            }

            const data = await response.json();
            cachedVideoId = data?.items?.[0]?.id?.videoId || null;
            return cachedVideoId;

        } catch(error) {
            // ... mantido igual ...
        }
    };

    // ⚡ updateLikes otimizado
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                // ... mantido igual ...
            }

            // 🆕 Pula requisição se não houver mudanças
            log('REQUEST', `Buscando estatísticas [${VIDEO_ID}]`);
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            
            quotaCounter.video++; // Cada video custa 1 quota

            if(statsResponse.status === 403) {
                // ... mantido igual ...
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;
            
            // 🆕 Atualiza apenas se houver mudança
            if(likes === lastLikeCount) {
                log('CACHE', 'Likes inalterados - Pulando atualização');
                return;
            }
            
            lastLikeCount = likes;
            
            // ... restante mantido igual ...

        } catch(error) {
            // ... mantido igual ...
        }
    };

    // 🆕 Controle inteligente de intervalos
    const manageIntervals = () => {
        clearInterval(updateInterval);
        updateInterval = setInterval(() => {
            // Ajusta dinamicamente baseado no status
            if(isLiveActive) {
                updateLikes();
                setTimeout(updateLikes, 5000); // Verificação rápida após mudança
            } else {
                updateLikes();
                checkLiveStatus();
            }
        }, isLiveActive ? 15000 : 30000); // Intervalos otimizados
    };

    // 🔄 checkLiveStatus modificado
    const checkLiveStatus = () => {
        if(quotaCounter.search >= 5000) { // Alerta de quota
            log('QUOTA', `Uso atual: Search=${quotaCounter.search} | Video=${quotaCounter.video}`);
        }
        
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                log('SYSTEM', 'Ajustando intervalo para modo ativo');
                isLiveActive = true;
                manageIntervals();
            }
        });
    };

    // ⚡ Inicialização modificada
    let updateInterval;
    manageIntervals();
    setInterval(checkLiveStatus, 30000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});