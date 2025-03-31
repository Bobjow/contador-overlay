document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = ["CHAVE1", "CHAVE2", "CHAVE3"]; // 👈 3 chaves diferentes
    let currentKeyIndex = 0;
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentVideoId = null;
    let isLive = false;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let updateInterval = null;

    // 👇 Controle de requisições por chave
    const requestCounter = {};
    let totalRequests = 0;
    const MAX_REQUESTS_PER_KEY = 900; // Margem de segurança

    const getCurrentKey = () => {
        if(requestCounter[apiKeys[currentKeyIndex]] >= MAX_REQUESTS_PER_KEY) {
            cycleApiKey('quota preventiva');
        }
        return apiKeys[currentKeyIndex];
    };

    const cycleApiKey = (reason) => {
        console.log(`Alternando para chave V${currentKeyIndex + 2} (Motivo: ${reason})`);
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    };

    const updateLikes = async () => {
        if(!isLive || totalRequests >= MAX_REQUESTS_PER_KEY * apiKeys.length) {
            console.log("Limite diário atingido ou off-air");
            clearInterval(updateInterval);
            return;
        }

        const currentKey = getCurrentKey();
        try {
            const stats = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${currentKey}`);
            
            if(stats.status === 403) {
                cycleApiKey('quota excedida');
                return;
            }

            const data = await stats.json();
            const likes = parseInt(data.items[0].statistics.likeCount) || 0;
            
            // Atualizações visuais
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

            // 👇 Contabiliza uso
            requestCounter[currentKey] = (requestCounter[currentKey] || 0) + 1;
            totalRequests++;
            
        } catch(error) {
            console.log("Erro:", error);
            cycleApiKey('erro de rede');
        }
    };

    const checkLiveStatus = async () => {
        const currentKey = getCurrentKey();
        try {
            const liveCheck = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${currentKey}`);
            
            if(liveCheck.status === 403) {
                cycleApiKey('quota excedida');
                return;
            }

            const liveData = await liveCheck.json();
            
            if(liveData.items?.length) {
                if(!isLive) {
                    isLive = true;
                    currentVideoId = liveData.items[0].id.videoId;
                    meta = 100;
                    updateInterval = setInterval(updateLikes, 60000); // 👈 1 minuto
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            } else {
                if(isLive) {
                    isLive = false;
                    clearInterval(updateInterval);
                }
            }

            requestCounter[currentKey] = (requestCounter[currentKey] || 0) + 1;
            totalRequests++;

        } catch(error) {
            console.log("Erro live check:", error);
            cycleApiKey('erro de rede');
        }
    };

    // Sistema de monitoramento
    setInterval(checkLiveStatus, 300000); // Verifica live a cada 5 minutos
    setInterval(() => { // Rotação de mensagens
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    }, 5000);

    checkLiveStatus(); // Inicial
});