document.addEventListener('DOMContentLoaded', () => {
    // 🔄 Estrutura original mantida
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
    
    // 🔄 Variáveis originais
    let keyIndex = 0;
    let isLiveActive = false;
    let errorCount = { 403: 0, other: 0 };

    // ✅ Novas variáveis para otimização
    let cachedVideoId = null;
    let lastLikeCount = 0;
    let quotaUsage = { search: 0, video: 0 };
    const INTERVALS = {
        LIVE_CHECK: 1800000,
        ACTIVE_MODE: 120000,
        INACTIVE_MODE: 3600000,
        MESSAGES: 5000
    };

    // 🔄 Rotação de mensagens (mantida integralmente)
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Rotação de chaves (mantida)
    const rotateKey = () => {
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        console.log(`Rotacionando para chave: ${keyIndex + 1}`);
        
        if(oldKey === apiKeys.length - 1) {
            errorCount[403] = 0;
            console.warn("Todas as chaves testadas - Reiniciando ciclo");
        }
    };

    // 🆕 Função de verificação programada
    const shouldFullCheck = () => {
        const now = new Date();
        return now.getMinutes() % 30 === 0; // Verificação completa a cada 30min
    };

    // ✨ getLiveVideoId modificado (Live API + otimização)
    const getLiveVideoId = async () => {
        try {
            // Verificação econômica da live cacheada
            if(cachedVideoId) {
                const check = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${cachedVideoId}&key=${apiKeys[keyIndex]}`);
                if(check.ok) {
                    quotaUsage.video++;
                    const data = await check.json();
                    if(data.items?.[0]?.liveStreamingDetails?.isLiveNow) return cachedVideoId;
                }
            }

            // ⚡ Só faz busca completa em horários específicos
            if(!shouldFullCheck()) return cachedVideoId;

            // 🆕 Usando Live API oficial (5 unidades)
            const response = await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastStatus=active&key=${apiKeys[keyIndex]}`);
            quotaUsage.search += 5;
            
            if(response.status === 403 || response.status === 400) {
                errorCount[403]++;
                rotateKey();
                return await getLiveVideoId();
            }

            const data = await response.json();
            cachedVideoId = data?.items?.[0]?.id || null;
            return cachedVideoId;

        } catch(error) {
            console.error("Erro na busca:", error);
            errorCount.other++;
            return null;
        }
    };

    // ⚡ updateLikes mantido com nova lógica
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                if(isLiveActive) {
                    meta = 100;
                    document.getElementById("progressBar").style.width = "0%";
                    document.getElementById("likeText").textContent = "00000 / 100";
                }
                isLiveActive = false;
                return;
            }

            if(!isLiveActive) {
                isLiveActive = true;
                meta = 100;
                console.log("Live ativa - Modo 2min");
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.ACTIVE_MODE);
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            quotaUsage.video++;
            
            if(statsResponse.status === 403) {
                rotateKey();
                return updateLikes();
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;
            
            if(likes !== lastLikeCount) {
                lastLikeCount = likes;
                document.getElementById("progressBar").style.width = `${Math.min((likes/meta)*100, 100)}%`;
                document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

                if(likes >= meta) {
                    meta += 100;
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                        style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }

        } catch(error) {
            console.error("Erro crítico:", error);
            if(errorCount.other++ > 10) location.reload();
        }
    };

    // ✅ Controle de intervalos mantido
    let updateInterval = setInterval(updateLikes, INTERVALS.INACTIVE_MODE);
    
    const checkLiveStatus = () => {
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.ACTIVE_MODE);
                updateLikes();
            } else if(!videoId) {
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, INTERVALS.INACTIVE_MODE);
            }
        });
    };

    // Intervalos originais preservados
    setInterval(checkLiveStatus, INTERVALS.LIVE_CHECK);
    setInterval(rotateMessages, INTERVALS.MESSAGES);
    updateLikes();
    messages[0].classList.add('active');

    // 🧮 Monitor de quotas atualizado
    setInterval(() => {
        const total = (quotaUsage.search * 5) + quotaUsage.video; // Custo ajustado
        console.log(`Uso de quotas: ${total}/10,000 (${(total/100).toFixed(1)}%)`);
    }, 3600000);
});