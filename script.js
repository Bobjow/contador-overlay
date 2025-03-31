document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4", // Chave Primária
        "SUA_CHAVE_V2_AQUI",  // 👈 Nova chave
        "SUA_CHAVE_V3_AQUI"   // 👈 Nova chave
    ];
    let currentKeyIndex = 0;
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentVideoId = null;
    let isLive = false;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let updateInterval = null;

    // 👇 Sistema de rotação de chaves
    const cycleApiKey = () => {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`Alternando para chave V${currentKeyIndex + 1}`);
    };

    const updateLikes = async () => {
        try {
            const currentKey = apiKeys[currentKeyIndex];
            const liveCheck = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${currentKey}`);
            
            // 👇 Detecta erro de quota
            if (liveCheck.status === 403) {
                cycleApiKey();
                return;
            }

            const liveData = await liveCheck.json();
            
            if (!liveData.items?.length) {
                if (isLive) {
                    console.log("Live encerrada - parando monitoramento");
                    clearInterval(updateInterval);
                    isLive = false;
                }
                return;
            }

            isLive = true;
            const videoId = liveData.items[0].id.videoId;

            if (videoId !== currentVideoId) {
                currentVideoId = videoId;
                meta = 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${currentKey}`);
            
            // 👇 Verifica erro na segunda chamada
            if (statsResponse.status === 403) {
                cycleApiKey();
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;
            
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if (likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.log("Erro geral:", error);
            cycleApiKey();
        }
    };

    // ... (restante do código permanece igual)
});