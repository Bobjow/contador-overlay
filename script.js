document.addEventListener('DOMContentLoaded', () => {
    // 🔄 Chaves mantidas na mesma estrutura
    const apiKeys = [
        "AIzaSyCYGP-aCD8xO3sW3KzDhbLbit0uWsCMfrw",
        "AIzaSyDpRqDDaVL9KdFWUwHrfq2ooLPTILmLhio",
        "AIzaSyA30bs5rQ5EQx25KjBfUcYygrHeVWrXDAs"
    ];
    
    const CHANNEL_ID = "UC_5voh8cFDi0JIX3mAzLbng";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    
    // 🔄 Variáveis originais + novas melhorias
    let keyIndex = 0;
    let isLiveActive = false;
    let errorCount = { 403: 0, other: 0 };
    let cachedVideoId = null;
    let lastLikeCount = 0;
    let quotaUsage = { search: 0, video: 0 };
    const INTERVALS = {
        LIVE_CHECK: 30000,     // 30 segundos (alterado para detecção imediata)
        ACTIVE_MODE: 10000,    // 10 segundos
        INACTIVE_MODE: 30000,   // 30 segundos
        MESSAGES: 5000          // 5 segundos
    };

    // ✅ Sistema de fallback para elementos
    const safeElements = {
        getProgressBar: () => document.getElementById('progressBar') || console.error('ProgressBar não encontrado'),
        getLikeText: () => document.getElementById('likeText') || console.error('LikeText não encontrado'),
        getGemText: () => gemText || console.error('GemText não encontrado')
    };

    // 📝 Sistema de logs aprimorado
    const log = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type}] ${message} (Chave: ${keyIndex + 1})`);
    };

    // 🔄 Rotação de mensagens (mantida)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Rotação de chaves atualizada
    const rotateKey = () => {
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        log('ROTATION', `Chave ${oldKey + 1} → ${keyIndex + 1} (${apiKeys[keyIndex].substr(0, 12)}...)`);
        
        if(oldKey === apiKeys.length - 1) {
            errorCount[403] = 0;
            log('WARNING', 'Ciclo de chaves reiniciado');
        }
    };

    // 🆕 Verificação programada (modificado para checks mais frequentes)
    const shouldFullCheck = () => {
        const now = new Date();
        return now.getMinutes() % 5 === 0; // Verificação a cada 5 minutos
    };

    // 🔍 getLiveVideoId otimizado (combinação de métodos para detecção rápida)
    const getLiveVideoId = async () => {
        try {
            // Primeira verificação rápida
            const quickResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=id&channelId=${CHANNEL_ID}&` +
                `eventType=live&type=video&` +
                `key=${apiKeys[keyIndex]}`
            );
            
            if(quickResponse.ok) {
                const quickData = await quickResponse.json();
                const videoId = quickData?.items?.[0]?.id?.videoId;
                if(videoId) {
                    cachedVideoId = videoId;
                    return videoId;
                }
            }

            // Fallback para verificação completa
            if(shouldFullCheck()) {
                log('SEARCH', 'Busca completa na API');
                const fullResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/liveBroadcasts?` +
                    `part=id&broadcastStatus=active&` +
                    `key=${apiKeys[keyIndex]}`
                );
                
                if(fullResponse.ok) {
                    const fullData = await fullResponse.json();
                    cachedVideoId = fullData?.items?.[0]?.id || null;
                    return cachedVideoId;
                }
            }

            return cachedVideoId;

        } catch(error) {
            log('CRITICAL', `Falha na busca: ${error.message}`);
            errorCount.other++;
            return null;
        }
    };

    // ⚡ updateLikes otimizado (mantido original com melhorias)
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                if(isLiveActive) {
                    log('STATUS', 'Live encerrada - Resetando sistema');
                    meta = 100;
                    safeElements.getProgressBar().style.width = "0%";
                    safeElements.getLikeText().textContent = "00000 / 100";
                }
                isLiveActive = false;
                return;
            }

            if(!isLiveActive) {
                log('STATUS', 'Nova live detectada - Modo ativo');
                isLiveActive = true;
                meta = 100;
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.ACTIVE_MODE);
            }

            log('REQUEST', `Buscando estatísticas [${VIDEO_ID}]`);
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            quotaUsage.video++;
            
            if(statsResponse.status === 403) {
                log('ERROR', 'Quota excedida na chave atual');
                rotateKey();
                return updateLikes();
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;
            log('DATA', `Likes: ${likes} | Meta: ${meta}`);

            if(likes !== lastLikeCount) {
                lastLikeCount = likes;
                safeElements.getProgressBar().style.width = `${Math.min((likes/meta)*100, 100)}%`;
                safeElements.getLikeText().textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                if(likes >= meta) {
                    log('META', `Nova meta: ${meta + 100}`);
                    meta += 100;
                    safeElements.getGemText().innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                        style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }

        } catch(error) {
            log('CRITICAL', `Erro geral: ${error.message} (${errorCount.other + 1}/10`);
            if(errorCount.other++ > 10) {
                log('SYSTEM', 'Reiniciando aplicação...');
                location.reload();
            }
        }
    };

    // ⏱ Controle de intervalos (ajustado para detecção rápida)
    let updateInterval = setInterval(updateLikes, INTERVALS.INACTIVE_MODE);
    
    const checkLiveStatus = () => {
        log('CHECK', 'Verificação periódica de status');
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                log('SYSTEM', 'Ativando monitoramento contínuo');
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.ACTIVE_MODE);
                updateLikes();
            }
        });
    };

    // 🚀 Inicialização
    setInterval(checkLiveStatus, INTERVALS.LIVE_CHECK);
    setInterval(rotateMessages, INTERVALS.MESSAGES);
    updateLikes();
    messages[0].classList.add('active');

    // ✅ Verificação de elementos críticos
    window.onload = function() {
        if (!document.querySelector('#messageBox') || messages.length === 0) {
            log('ERROR', 'Elementos críticos não encontrados!');
            console.log('Verifique:\n1. Inclusão do script\n2. IDs no HTML\n3. Cache (Ctrl+F5)');
        }
    };

    // 📊 Monitor de quotas
    setInterval(() => {
        const total = (quotaUsage.search * 5) + quotaUsage.video;
        log('QUOTA', `Uso: ${total}/10,000 (${(total/100).toFixed(1)}%)`);
    }, 3600000);
});