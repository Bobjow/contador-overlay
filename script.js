document.addEventListener('DOMContentLoaded', () => {
    // 👇 Sistema de múltiplas chaves (adicione suas novas chaves)
    const apiKeys = [
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4",
        "CHAVE_API_V2_AQUI",
        "CHAVE_API_V3_AQUI"
    ];
    let currentKeyIndex = 0;
    
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let isLive = false;
    let updateInterval = null;

    // 👇 Função para alternar chaves automaticamente
    const cycleApiKey = () => {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`Usando chave V${currentKeyIndex + 1}`);
    };

    const updateLikes = async () => {
        try {
            const currentKey = apiKeys[currentKeyIndex];
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${currentKey}`);
            
            // 👇 Verifica erro de quota
            if(liveResponse.status === 403) {
                cycleApiKey();
                return;
            }

            const liveData = await liveResponse.json();
            
            if (liveData.items?.length > 0) {
                isLive = true;
                const videoId = liveData.items[0].id.videoId;
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${currentKey}`);
                
                // 👇 Verifica erro na segunda chamada
                if(statsResponse.status === 403) {
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
            } else {
                if(isLive) {
                    isLive = false;
                    clearInterval(updateInterval); // 👈 Para chamadas se live terminar
                }
            }
        } catch(error) {
            console.log("Erro detectado, alternando chave...");
            cycleApiKey();
        }
    };

    // 👇 Sistema de verificação otimizado
    const startCheck = () => {
        updateLikes();
        updateInterval = setInterval(updateLikes, 300000); // Mantém 5 minutos
    };

    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // Inicia tudo
    startCheck();
    setInterval(rotateMessages, 5000);
});