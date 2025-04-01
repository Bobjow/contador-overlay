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
    let requestCounter = 0;
    let errorPause = false;
    // ✅ Sistema de Cache Duplo (mantido)
    let cache = {
        videoId: null,
        likes: 0,
        expiry: 0,
        etag: ''
    };
    const INTERVALS = {
        LIVE_CHECK: 900000,
        ACTIVE_MODE: 120000,
        INACTIVE_MODE: 1800000,
        MESSAGES: 5000
    };

    // ✅ Função auxiliar nova (posicionada antes do uso)
    const isLiveStillActive = async (videoId) => {
        const check = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKeys[keyIndex]}`);
        return check.ok && (await check.json()).items?.[0]?.liveStreamingDetails?.isLiveNow;
    };

    // ✅ Sistema de verificação de horário (mantido)
    const isInactivePeriod = () => {
        const hour = new Date().getHours();
        return hour >= 18 || hour < 9;
    };

    // ✅ Sistema de fallback (mantido intacto)
    const safeElements = {
        getProgressBar: () => document.getElementById('progressBar') || console.error('ProgressBar não encontrado'),
        getLikeText: () => document.getElementById('likeText') || console.error('LikeText não encontrado'),
        getGemText: () => gemText || console.error('GemText não encontrado')
    };

    // 📝 Logs (mantido)
    const log = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type}] ${message} (Chave: ${keyIndex + 1})`);
    };

    // 🔄 Rotação de mensagens (versão otimizada)
    const rotateMessages = () => {
        const activeMsg = document.querySelector('.msg.active');
        if(activeMsg) activeMsg.classList.remove('active');
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % messages.length;
    };

    // 🔄 Rotação de chaves atualizada
    const rotateKey = () => {
        if(errorCount[403] > 3) {
            errorPause = true;
            log('ERROR', 'Pausa de 5min por excesso de erros 403');
            setTimeout(() => {
                errorPause = false;
                errorCount[403] = 0;
            }, 300000);
        }
        
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        log('ROTATION', `Chave ${oldKey + 1} → ${keyIndex + 1} (${apiKeys[keyIndex].substr(0, 12)}...)`);
        
        if(quotaUsage.video >= 10000) {
            quotaUsage.video = 0;
            log('QUOTA', 'Reset diário de cota');
        }
        
        if(oldKey === apiKeys.length - 1) errorCount[403] = 0;
    };

    // 🔍 getLiveVideoId com verificação de cache
    const getLiveVideoId = async () => {
        try {
            if(cachedVideoId && !await isLiveStillActive(cachedVideoId)) {
                log('CACHE', 'Live encerrada - Resetando cache');
                cachedVideoId = null;
                cache = { videoId: null, likes: 0, expiry: 0, etag: '' };
            }
            
            if(isInactivePeriod()) return null;
            
            const headers = cache.etag ? { 'If-None-Match': cache.etag } : {};
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&` +
                `channelId=${CHANNEL_ID}&` +
                `eventType=live&` +
                `type=video&` +
                `key=${apiKeys[keyIndex]}`, 
                { headers }
            );

            if(response.status === 304) {
                log('CACHE', 'Dados inalterados');
                return cache.videoId;
            }

            if(response.ok) {
                const data = await response.json();
                cache = {
                    videoId: data?.items?.[0]?.id?.videoId,
                    expiry: Date.now() + 120000,
                    etag: response.headers.get('ETag') || ''
                };
                cachedVideoId = cache.videoId;
                return cache.videoId;
            }

            return null;
        } catch(error) {
            log('CRITICAL', error.message);
            return null;
        }
    };

    // ⚡ updateLikes com novas melhorias
    const updateLikes = async () => {
        try {
            requestCounter++;
            if(errorPause) return;
            
            if(Date.now() < cache.expiry && Math.abs(cache.likes - lastLikeCount) < 3) {
                return;
            }

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
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.ACTIVE_MODE);
            }

            const statsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=statistics&` +
                `id=${VIDEO_ID}&` +
                `key=${apiKeys[keyIndex]}`
            );
            
            if(statsResponse.ok) {
                quotaUsage.video += 1;
                const statsData = await statsResponse.json();
                const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;
                
                cache.likes = likes;
                cache.expiry = Date.now() + 120000;
                
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
            }

        } catch(error) {
            errorCount.other++;
            if(errorCount.other > 10) {
                log('SYSTEM', 'Reiniciando aplicação...');
                location.reload();
            }
            log('CRITICAL', `Erro geral: ${error.message}`);
        }
    };

    // ... (restante do código original mantido intacto)
    let updateInterval = setInterval(updateLikes, INTERVALS.LIVE_CHECK);
    setInterval(rotateMessages, INTERVALS.MESSAGES);
});