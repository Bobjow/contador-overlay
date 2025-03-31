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

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // ✅ Rotação melhorada mantendo sua lógica
    const rotateKey = () => {
        const oldKey = keyIndex;
        keyIndex = (keyIndex + 1) % apiKeys.length;
        console.log(`Rotacionando para chave: ${keyIndex + 1}`);
        
        if(oldKey === apiKeys.length - 1) {
            errorCount[403] = 0;
            console.warn("Todas as chaves testadas - Reiniciando ciclo");
        }
    };

    // ✅ getLiveVideoId com tratamento seguro
    const getLiveVideoId = async () => {
        try {
            console.log(`Usando chave ${keyIndex + 1} (${apiKeys[keyIndex].substr(0, 12)}...)`);
            
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403 || response.status === 400) {
                errorCount[403]++;
                rotateKey();
                return await getLiveVideoId(); // Tenta novamente com nova chave
            }

            const data = await response.json();
            return data?.items?.[0]?.id?.videoId || null;

        } catch(error) {
            console.error("Erro na busca da live:", error);
            errorCount.other++;
            return null;
        }
    };

    // ✅ updateLikes com controle refinado
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
                console.log("Live ativa - Sistema reiniciado!");
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, 10000);
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                rotateKey();
                return updateLikes(); // Repete com nova chave
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData?.items?.[0]?.statistics?.likeCount) || 0;

            // ✅ UI original mantida
            document.getElementById("progressBar").style.width = `${Math.min((likes/meta)*100, 100)}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.error("Erro crítico:", error);
            if(errorCount.other++ > 10) location.reload();
        }
    };

    // ✅ Intervalos otimizados mantendo sua lógica
    let updateInterval = setInterval(updateLikes, 30000);
    
    const checkLiveStatus = () => {
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, 10000);
                updateLikes();
            }
        });
    };

    // Seus intervalos originais mantidos
    setInterval(checkLiveStatus, 30000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});