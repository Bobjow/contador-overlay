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
    
    // 🔄 Variáveis originais + novas melhorias
    let keyIndex = 0;
    let isLiveActive = false;
    let errorCount = { 403: 0, other: 0 };
    let cachedVideoId = null;
    let lastLikeCount = 0;
    let quotaUsage = { search: 0, video: 0 };
    const INTERVALS = {
        LIVE_CHECK: 1800000,    // 30 minutos
        ACTIVE_MODE: 10000,     // 10 segundos
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

    // 🆕 Verificação programada
    const shouldFullCheck = () => {
        const now = new Date();
        return now.getMinutes() % 30 === 0;
    };

    // 🔍 getLiveVideoId otimizado
    const getLiveVideoId = async () => {
        try {
            if(cachedVideoId) {
                log('CACHE', `Verificando video em cache: ${cachedVideoId}`);
                const check = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${cachedVideoId}&key=${apiKeys[keyIndex]}`);
                if(check.ok) {
                    quotaUsage.video++;
                    const data = await check.json();
                    if(data.items?.[0]?.liveStreamingDetails?.isLiveNow) return cachedVideoId;
                }
            }

            if(!shouldFullCheck()) return cachedVideoId;

            log('SEARCH', 'Busca completa na API');
            const response = await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastStatus=active&key=${apiKeys[keyIndex]}`);
            quotaUsage.search += 5;
            
            if(response.status === 403 || response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                log('ERROR', `API Error: ${errorData.error?.message || 'Unknown error'}`);
                errorCount[403]++;
                rotateKey();
                return await getLiveVideoId();
            }

            const data = await response.json();
            cachedVideoId = data?.items?.[0]?.id || null;
            log('RESPONSE', `Live encontrada: ${cachedVideoId ? 'Sim' : 'Não'}`);
            return cachedVideoId;

        } catch(error) {
            log('CRITICAL', `Falha na busca: ${error.message}`);
            errorCount.other++;
            return null;
        }
    };

    // ⚡ updateLikes otimizado
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

    // ⏱ Controle de intervalos
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