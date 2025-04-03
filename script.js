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
    
    // ⚡ NOVO: Controle entre cenas
    let crossSceneState = {
        lastVideoId: null,
        changeCount: 0
    };

    // ✅ Sistema de Cache Duplo (mantido intacto)
    let cache = {
        videoId: null,
        likes: 0,
        expiry: 0,
        etag: ''
    };

    // ⚡ INTERVALOS AJUSTADOS (1.5min e 1h)
    const INTERVALS = {
        LIVE_CHECK: 5400000, // 1h30min (5400000ms)
        ACTIVE_MODE: 120000,   // 2min 
        INACTIVE_MODE: 3600000, // 1h (mantido seu pedido)
        MESSAGES: 5000
    };

    // ✅ Função auxiliar (mantida intacta)
    const isLiveStillActive = async (videoId) => {
        const check = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKeys[keyIndex]}`);
        return check.ok && (await check.json()).items?.[0]?.liveStreamingDetails?.isLiveNow;
    };

    // ✅ Sistema de verificação de horário (mantido intacto)
    const isInactivePeriod = () => {
        const hour = new Date().getHours();
        return hour >= 18 || hour < 13;
    };

    // ✅ Sistema de fallback (mantido intacto)
    const safeElements = {
        getProgressBar: () => document.getElementById('progressBar') || console.error('ProgressBar não encontrado'),
        getLikeText: () => document.getElementById('likeText') || console.error('LikeText não encontrado'),
        getGemText: () => gemText || console.error('GemText não encontrado')
    };

    // 📝 Logs (mantido intacto)
    const log = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type}] ${message} (Chave: ${keyIndex + 1})`);
    };

    // 🔄 Rotação de mensagens (mantida intacta)
    const rotateMessages = () => {
        const activeMsg = document.querySelector('.msg.active');
        if(activeMsg) activeMsg.classList.remove('active');
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % messages.length;
    };

    // ⚡ ROTAÇÃO DE CHAVES OTIMIZADA (nova implementação)
    const rotateKey = () => {
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        quotaUsage.video = 0;
        cachedVideoId = null;
        cache.expiry = 0;
        log('ROTATION', `Chave ${oldKey+1} → ${keyIndex+1} | Quota: ${quotaUsage.video}/9500`);
    };

    // ⚡ DETECÇÃO DE MUDANÇA DE CENA (nova função)
    const checkSceneChange = (videoId) => {
        if(videoId && videoId !== crossSceneState.lastVideoId) {
            crossSceneState.changeCount++;
            log('SCENE', `Nova cena detectada (${crossSceneState.changeCount}x)`);
            crossSceneState.lastVideoId = videoId;
            meta = 100;
            safeElements.getProgressBar().style.width = "0%";
            safeElements.getLikeText().textContent = "00000 / 100";
        }
    };

    // 🔍 getLiveVideoId (mantido com pequeno ajuste)
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

            if(response.status === 304) return cache.videoId;

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

    // ⚡ updateLikes ATUALIZADO (combinação de endpoints)
    const updateLikes = async () => {
        try {
            if(errorPause) return;
            
            // ⚡ Verificação de quota
            if(quotaUsage.video >= 9500) {
                rotateKey();
                return;
            }

            const VIDEO_ID = await getLiveVideoId();
            checkSceneChange(VIDEO_ID); // ⚡ Chamada nova
            
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

            // ⚡ Requisição combinada
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=statistics,liveStreamingDetails&` + // ⚡ Combinação
                `id=${VIDEO_ID}&` +
                `key=${apiKeys[keyIndex]}`
            );

            if(response.ok) {
                quotaUsage.video += 3; // ⚡ Custo ajustado
                const data = await response.json();
                const likes = parseInt(data?.items?.[0]?.statistics?.likeCount) || 0;
                
                if(likes !== lastLikeCount) {
                    lastLikeCount = likes;
                    safeElements.getProgressBar().style.width = `${Math.min((likes/meta)*100, 100)}%`;
                    safeElements.getLikeText().textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                    if(likes >= meta) {
                        meta += 100;
                        safeElements.getGemText().innerHTML = `META: <img src="https://raw.githubusercontent.com/bobjow/contador-overlay/main/gemas-png.png" 
                            class="gem-glow gem-icon" style="width:45px;height:45px;vertical-align:middle;margin-right:10px;"> ${meta}`;
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

    // ✅ Inicialização mantida com verificação
    const init = () => {
        if(!document.getElementById('progressBar')) {
            console.error('Elemento progressBar não encontrado!');
            return;
        }
        log('SYSTEM', 'Sistema iniciado com sucesso');
        setInterval(updateLikes, INTERVALS.LIVE_CHECK);
        setInterval(rotateMessages, INTERVALS.MESSAGES);
        updateLikes();
    };

    init();
});
