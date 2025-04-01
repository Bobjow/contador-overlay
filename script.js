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

    // 📝 Novo sistema de logs
    const log = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type}] ${message} (Chave: ${keyIndex + 1})`);
    };

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    const rotateKey = () => {
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        log('ROTATION', `Alternando para chave ${keyIndex + 1} (${apiKeys[keyIndex].substr(0, 12)}...)`); // 📝
        
        if(oldKey === apiKeys.length - 1) {
            errorCount[403] = 0;
            log('WARNING', 'Ciclo completo de chaves reiniciado'); // 📝
        }
    };

    const getLiveVideoId = async () => {
        try {
            log('REQUEST', `Buscando live... [${CHANNEL_ID}]`); // 📝
            
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403 || response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                log('ERROR', `API Error: ${errorData.error?.message || 'Unknown error'}`); // 📝
                errorCount[403]++;
                rotateKey();
                return await getLiveVideoId();
            }

            const data = await response.json();
            log('RESPONSE', `Live encontrada: ${data?.items?.[0]?.id?.videoId ? 'Sim' : 'Não'}`); // 📝
            return data?.items?.[0]?.id?.videoId || null;

        } catch(error) {
            log('CRITICAL', `Falha na busca: ${error.message}`); // 📝
            errorCount.other++;
            return null;
        }
    };

    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                if(isLiveActive) {
                    log('STATUS', 'Live encerrada - Resetando sistema'); // 📝
                    meta = 100;
                    document.getElementById("progressBar").style.width = "0%";
                    document.getElementById("likeText").textContent = "00000 / 100";
                }
                isLiveActive = false;
                return;
            }

            if(!isLiveActive) {
                log('STATUS', 'Nova live detectada - Iniciando monitoramento'); // 📝
                isLiveActive = true;
                meta = 100;
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, 10000);
            }

            log('REQUEST', `Buscando estatísticas [${VIDEO_ID}]`); // 📝
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                log('ERROR', 'Quota excedida na chave atual'); // 📝
                rotateKey();
                return updateLikes();
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;
            log('DATA', `Likes recebidos: ${likes} | Meta atual: ${meta}`); // 📝

            document.getElementById("progressBar").style.width = `${Math.min((likes/meta)*100, 100)}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                log('META', `Nova meta definida: ${meta + 100}`); // 📝
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            log('CRITICAL', `Erro geral: ${error.message} (${errorCount.other + 1}/10)`); // 📝
            if(errorCount.other++ > 10) {
                log('SYSTEM', 'Reiniciando aplicação...'); // 📝
                location.reload();
            }
        }
    };

    let updateInterval = setInterval(updateLikes, 30000);
    
    const checkLiveStatus = () => {
        log('CHECK', 'Verificando status da live'); // 📝
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                log('SYSTEM', 'Ajustando intervalo para modo ativo'); // 📝
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, 10000);
                updateLikes();
            }
        });
    };

    setInterval(checkLiveStatus, 30000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});